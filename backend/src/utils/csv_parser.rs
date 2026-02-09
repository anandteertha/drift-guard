use crate::models::{CategoricalStats, FeatureStats, FeatureStatsData, FeatureType, NumericStats};
use csv::ReaderBuilder;
use std::collections::HashMap;
use std::io::Read;

pub fn parse_csv<R: Read>(
    reader: R,
) -> anyhow::Result<(Vec<HashMap<String, String>>, Vec<String>)> {
    let mut rdr = ReaderBuilder::new().has_headers(true).from_reader(reader);

    let headers = rdr.headers()?.clone();
    let header_names: Vec<String> = headers.iter().map(|h| h.to_string()).collect();

    let mut records = Vec::new();
    for result in rdr.records() {
        let record = result?;
        let mut map = HashMap::new();
        for (i, field) in record.iter().enumerate() {
            if i < header_names.len() {
                map.insert(header_names[i].clone(), field.to_string());
            }
        }
        records.push(map);
    }

    Ok((records, header_names))
}

pub fn infer_feature_types(
    records: &[HashMap<String, String>],
    feature_names: &[String],
) -> HashMap<String, FeatureType> {
    let mut types = HashMap::new();

    for feature_name in feature_names {
        if feature_name == "prediction"
            || feature_name == "confidence"
            || feature_name == "timestamp"
        {
            continue; // Skip special columns
        }

        let mut is_numeric = true;
        let mut has_value = false;

        for record in records {
            if let Some(value) = record.get(feature_name) {
                let trimmed = value.trim();
                if trimmed.is_empty() {
                    continue;
                }
                has_value = true;
                if trimmed.parse::<f64>().is_err() {
                    is_numeric = false;
                    break;
                }
            }
        }

        if has_value && is_numeric {
            types.insert(feature_name.clone(), FeatureType::Numeric);
        } else {
            types.insert(feature_name.clone(), FeatureType::Categorical);
        }
    }

    types
}

pub fn build_baseline_stats(
    records: &[HashMap<String, String>],
    feature_names: &[String],
    feature_types: &HashMap<String, FeatureType>,
) -> Vec<FeatureStats> {
    let mut stats = Vec::new();

    for feature_name in feature_names {
        if feature_name == "prediction"
            || feature_name == "confidence"
            || feature_name == "timestamp"
        {
            continue;
        }

        let feature_type = feature_types.get(feature_name).unwrap();
        let feature_stat = match feature_type {
            FeatureType::Numeric => {
                let numeric_stats = build_numeric_histogram(records, feature_name);
                FeatureStats {
                    name: feature_name.clone(),
                    feature_type: FeatureType::Numeric,
                    stats: FeatureStatsData::Numeric(numeric_stats),
                }
            }
            FeatureType::Categorical => {
                let categorical_stats = build_categorical_frequencies(records, feature_name);
                FeatureStats {
                    name: feature_name.clone(),
                    feature_type: FeatureType::Categorical,
                    stats: FeatureStatsData::Categorical(categorical_stats),
                }
            }
        };

        stats.push(feature_stat);
    }

    stats
}

fn build_numeric_histogram(
    records: &[HashMap<String, String>],
    feature_name: &str,
) -> NumericStats {
    let mut values: Vec<f64> = records
        .iter()
        .filter_map(|r| {
            r.get(feature_name)
                .and_then(|v| v.trim().parse::<f64>().ok())
        })
        .collect();

    if values.is_empty() {
        return NumericStats {
            bins: vec![0.0, 1.0],
            probabilities: vec![1.0],
        };
    }

    values.sort_by(|a, b| a.partial_cmp(b).unwrap());

    let min = values[0];
    let max = values[values.len() - 1];

    // Create 10 bins using min/max binning
    let num_bins = 10;
    let bin_width = if max > min {
        (max - min) / num_bins as f64
    } else {
        1.0
    };

    let mut bins = vec![min];
    for i in 1..=num_bins {
        bins.push(min + bin_width * i as f64);
    }

    // Count values in each bin
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

    // Convert to probabilities
    let total = values.len() as f64;
    let probabilities: Vec<f64> = bin_counts
        .iter()
        .map(|&count| count as f64 / total)
        .collect();

    NumericStats {
        bins,
        probabilities,
    }
}

fn build_categorical_frequencies(
    records: &[HashMap<String, String>],
    feature_name: &str,
) -> CategoricalStats {
    let mut counts: HashMap<String, usize> = HashMap::new();
    let mut total = 0;

    for record in records {
        if let Some(value) = record.get(feature_name) {
            let trimmed = value.trim();
            if !trimmed.is_empty() {
                *counts.entry(trimmed.to_string()).or_insert(0) += 1;
                total += 1;
            }
        }
    }

    let frequencies: HashMap<String, f64> = if total > 0 {
        counts
            .into_iter()
            .map(|(k, v)| (k, v as f64 / total as f64))
            .collect()
    } else {
        HashMap::new()
    };

    CategoricalStats { frequencies }
}

pub fn compute_prediction_rate(records: &[HashMap<String, String>]) -> f64 {
    let predictions: Vec<f64> = records
        .iter()
        .filter_map(|r| {
            r.get("prediction")
                .and_then(|v| v.trim().parse::<f64>().ok())
        })
        .collect();

    if predictions.is_empty() {
        return 0.0;
    }

    predictions.iter().sum::<f64>() / predictions.len() as f64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_csv() {
        let csv_data = "prediction,income,age\n0,25000,25\n1,30000,28\n";
        let (records, headers) = parse_csv(csv_data.as_bytes()).unwrap();

        assert_eq!(headers, vec!["prediction", "income", "age"]);
        assert_eq!(records.len(), 2);
        assert_eq!(records[0].get("prediction"), Some(&"0".to_string()));
        assert_eq!(records[0].get("income"), Some(&"25000".to_string()));
    }

    #[test]
    fn test_infer_feature_types() {
        let mut records = Vec::new();
        let mut record1 = HashMap::new();
        record1.insert("income".to_string(), "25000".to_string());
        record1.insert("location".to_string(), "urban".to_string());
        records.push(record1);

        let feature_names = vec!["income".to_string(), "location".to_string()];
        let types = infer_feature_types(&records, &feature_names);

        assert_eq!(types.get("income"), Some(&FeatureType::Numeric));
        assert_eq!(types.get("location"), Some(&FeatureType::Categorical));
    }

    #[test]
    fn test_compute_prediction_rate() {
        let mut records = Vec::new();
        for i in 0..10 {
            let mut record = HashMap::new();
            record.insert(
                "prediction".to_string(),
                if i < 3 {
                    "1".to_string()
                } else {
                    "0".to_string()
                },
            );
            records.push(record);
        }

        let rate = compute_prediction_rate(&records);
        assert!((rate - 0.3).abs() < 0.001);
    }

    #[test]
    fn test_build_numeric_histogram() {
        let mut records = Vec::new();
        for i in 0..10 {
            let mut record = HashMap::new();
            record.insert("income".to_string(), (10000 + i * 1000).to_string());
            records.push(record);
        }

        let stats = build_numeric_histogram(&records, "income");
        assert_eq!(stats.bins.len(), 11); // 10 bins = 11 edges
        assert_eq!(stats.probabilities.len(), 10);
        // Probabilities should sum to ~1.0
        let sum: f64 = stats.probabilities.iter().sum();
        assert!((sum - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_build_categorical_frequencies() {
        let mut records = Vec::new();
        let locations = vec!["urban", "suburban", "urban", "rural", "suburban"];
        for location in locations {
            let mut record = HashMap::new();
            record.insert("location".to_string(), location.to_string());
            records.push(record);
        }

        let stats = build_categorical_frequencies(&records, "location");
        assert!((stats.frequencies.get("urban").unwrap() - 0.4).abs() < 0.001);
        assert!((stats.frequencies.get("suburban").unwrap() - 0.4).abs() < 0.001);
        assert!((stats.frequencies.get("rural").unwrap() - 0.2).abs() < 0.001);
    }
}
