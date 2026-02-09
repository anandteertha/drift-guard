use crate::models::{CategoricalStats, FeatureStats, FeatureStatsData, NumericStats};
use std::collections::HashMap;

pub fn compute_feature_drift(baseline_stats: &FeatureStats, incoming_values: &[String]) -> f64 {
    match &baseline_stats.stats {
        FeatureStatsData::Numeric(baseline_numeric) => {
            compute_numeric_drift(baseline_numeric, incoming_values)
        }
        FeatureStatsData::Categorical(baseline_categorical) => {
            compute_categorical_drift(baseline_categorical, incoming_values)
        }
    }
}

fn compute_numeric_drift(baseline: &NumericStats, incoming_values: &[String]) -> f64 {
    // Parse incoming values
    let values: Vec<f64> = incoming_values
        .iter()
        .filter_map(|v| v.trim().parse::<f64>().ok())
        .collect();

    if values.is_empty() || baseline.bins.len() < 2 {
        return 0.0;
    }

    // Build incoming histogram using same bin edges
    let min = baseline.bins[0];
    let max = baseline.bins[baseline.bins.len() - 1];
    let num_bins = baseline.probabilities.len();
    let bin_width = if max > min {
        (max - min) / num_bins as f64
    } else {
        1.0
    };

    let mut bin_counts = vec![0; num_bins];
    for value in &values {
        let bin_index = if bin_width > 0.0 {
            ((value - min) / bin_width).floor() as usize
        } else {
            0
        };
        let bin_index = bin_index.min(num_bins - 1);
        bin_counts[bin_index] += 1;
    }

    let total = values.len() as f64;
    let incoming_probs: Vec<f64> = bin_counts
        .iter()
        .map(|&count| count as f64 / total)
        .collect();

    // Compute L1 distance (simpler than Jensen-Shannon for v1)
    let mut l1_distance = 0.0;
    for i in 0..num_bins {
        l1_distance += (baseline.probabilities[i] - incoming_probs[i]).abs();
    }

    // Normalize to 0-1 range (L1 distance for distributions is 0-2, so divide by 2)
    l1_distance / 2.0
}

fn compute_categorical_drift(baseline: &CategoricalStats, incoming_values: &[String]) -> f64 {
    // Count incoming frequencies
    let mut incoming_counts: HashMap<String, usize> = HashMap::new();
    let mut total = 0;

    for value in incoming_values {
        let trimmed = value.trim();
        if !trimmed.is_empty() {
            *incoming_counts.entry(trimmed.to_string()).or_insert(0) += 1;
            total += 1;
        }
    }

    if total == 0 {
        return 0.0;
    }

    // Build incoming frequencies
    let incoming_freqs: HashMap<String, f64> = incoming_counts
        .into_iter()
        .map(|(k, v)| (k, v as f64 / total as f64))
        .collect();

    // Collect all categories (baseline + incoming)
    let mut all_categories: Vec<String> = baseline.frequencies.keys().cloned().collect();
    for cat in incoming_freqs.keys() {
        if !all_categories.contains(cat) {
            all_categories.push(cat.clone());
        }
    }

    // Compute L1 distance
    let mut l1_distance = 0.0;
    for category in &all_categories {
        let baseline_freq = baseline.frequencies.get(category).copied().unwrap_or(0.0);
        let incoming_freq = incoming_freqs.get(category).copied().unwrap_or(0.0);
        l1_distance += (baseline_freq - incoming_freq).abs();
    }

    // Normalize to 0-1 range
    l1_distance / 2.0
}

pub fn compute_prediction_shift(baseline_rate: f64, incoming_rate: f64) -> f64 {
    (incoming_rate - baseline_rate).abs()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{
        CategoricalStats, FeatureStats, FeatureStatsData, FeatureType, NumericStats,
    };

    #[test]
    fn test_compute_prediction_shift() {
        assert!((compute_prediction_shift(0.1, 0.3) - 0.2).abs() < 0.001);
        assert!((compute_prediction_shift(0.5, 0.5) - 0.0).abs() < 0.001);
    }

    #[test]
    fn test_compute_numeric_drift_same_distribution() {
        let baseline = NumericStats {
            bins: vec![0.0, 10.0, 20.0, 30.0],
            probabilities: vec![0.5, 0.3, 0.2],
        };

        // Same distribution
        let incoming = vec![
            "5".to_string(),
            "5".to_string(),
            "15".to_string(),
            "15".to_string(),
            "15".to_string(),
            "25".to_string(),
        ];
        let drift = compute_numeric_drift(&baseline, &incoming);

        // Should have some drift but not extreme
        assert!(drift >= 0.0 && drift <= 1.0);
    }

    #[test]
    fn test_compute_numeric_drift_different_distribution() {
        let baseline = NumericStats {
            bins: vec![0.0, 10.0, 20.0, 30.0],
            probabilities: vec![1.0, 0.0, 0.0], // All in first bin
        };

        // Completely different - all in last bin
        let incoming = vec!["25".to_string(), "25".to_string(), "25".to_string()];
        let drift = compute_numeric_drift(&baseline, &incoming);

        // Should have high drift
        assert!(drift > 0.5);
    }

    #[test]
    fn test_compute_categorical_drift_same() {
        let mut baseline_freqs = HashMap::new();
        baseline_freqs.insert("urban".to_string(), 0.5);
        baseline_freqs.insert("suburban".to_string(), 0.5);
        let baseline = CategoricalStats {
            frequencies: baseline_freqs,
        };

        let incoming = vec!["urban".to_string(), "suburban".to_string()];
        let drift = compute_categorical_drift(&baseline, &incoming);

        // Should have low drift (same distribution)
        assert!(drift < 0.5);
    }

    #[test]
    fn test_compute_categorical_drift_different() {
        let mut baseline_freqs = HashMap::new();
        baseline_freqs.insert("urban".to_string(), 1.0);
        baseline_freqs.insert("suburban".to_string(), 0.0);
        let baseline = CategoricalStats {
            frequencies: baseline_freqs,
        };

        // All suburban (completely different)
        let incoming = vec![
            "suburban".to_string(),
            "suburban".to_string(),
            "suburban".to_string(),
        ];
        let drift = compute_categorical_drift(&baseline, &incoming);

        // Should have high drift
        assert!(drift > 0.5);
    }

    #[test]
    fn test_compute_feature_drift_numeric() {
        let baseline_stats = FeatureStats {
            name: "income".to_string(),
            feature_type: FeatureType::Numeric,
            stats: FeatureStatsData::Numeric(NumericStats {
                bins: vec![0.0, 10.0, 20.0],
                probabilities: vec![0.5, 0.5],
            }),
        };

        let incoming = vec!["5".to_string(), "15".to_string()];
        let drift = compute_feature_drift(&baseline_stats, &incoming);
        assert!(drift >= 0.0 && drift <= 1.0);
    }

    #[test]
    fn test_compute_feature_drift_categorical() {
        let mut freqs = HashMap::new();
        freqs.insert("urban".to_string(), 1.0);
        let baseline_stats = FeatureStats {
            name: "location".to_string(),
            feature_type: FeatureType::Categorical,
            stats: FeatureStatsData::Categorical(CategoricalStats { frequencies: freqs }),
        };

        let incoming = vec!["suburban".to_string()];
        let drift = compute_feature_drift(&baseline_stats, &incoming);
        assert!(drift > 0.5); // High drift
    }
}
