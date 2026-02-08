use crate::models::FeatureStats;
use crate::services::drift_evaluator::DriftResult;
use crate::storage::alerts;
use sqlx::SqlitePool;

const FEATURE_DRIFT_WARN_THRESHOLD: f64 = 0.10;
const FEATURE_DRIFT_CRITICAL_THRESHOLD: f64 = 0.20;
const PREDICTION_SHIFT_WARN_THRESHOLD: f64 = 0.10;
const PREDICTION_SHIFT_CRITICAL_THRESHOLD: f64 = 0.20;

pub async fn generate_alerts(
    pool: &SqlitePool,
    project_id: &str,
    baseline_version: i64,
    drift_result: &DriftResult,
    baseline_features: &[FeatureStats],
    incoming_headers: &[String],
) -> anyhow::Result<(usize, String)> {
    let mut alerts_created = 0;
    let mut max_severity = "OK".to_string();

    // Schema validation
    let baseline_feature_names: std::collections::HashSet<String> = baseline_features
        .iter()
        .map(|f| f.name.clone())
        .collect();

    let incoming_feature_names: std::collections::HashSet<String> = incoming_headers
        .iter()
        .filter(|h| *h != "prediction" && *h != "confidence" && *h != "timestamp")
        .cloned()
        .collect();

    // Check for missing features
    for feature_name in &baseline_feature_names {
        if !incoming_feature_names.contains(feature_name) {
            alerts::create_alert(
                pool,
                project_id,
                baseline_version,
                "CRITICAL",
                "SCHEMA",
                Some(feature_name),
                None,
                &format!("Missing required feature: {}", feature_name),
            )
            .await?;
            alerts_created += 1;
            max_severity = "CRITICAL".to_string();
        }
    }

    // Check for extra features
    for feature_name in &incoming_feature_names {
        if !baseline_feature_names.contains(feature_name) {
            alerts::create_alert(
                pool,
                project_id,
                baseline_version,
                "WARN",
                "SCHEMA",
                Some(feature_name),
                None,
                &format!("Extra feature detected: {}", feature_name),
            )
            .await?;
            alerts_created += 1;
            if max_severity == "OK" {
                max_severity = "WARN".to_string();
            }
        }
    }

    // Feature drift alerts
    for (feature_name, drift_value) in &drift_result.feature_drifts {
        let severity = if *drift_value >= FEATURE_DRIFT_CRITICAL_THRESHOLD {
            "CRITICAL"
        } else if *drift_value >= FEATURE_DRIFT_WARN_THRESHOLD {
            "WARN"
        } else {
            continue;
        };

        alerts::create_alert(
            pool,
            project_id,
            baseline_version,
            severity,
            "FEATURE_DRIFT",
            Some(feature_name),
            Some(*drift_value),
            &format!(
                "Feature '{}' drift detected: {:.4} (threshold: {})",
                feature_name,
                drift_value,
                if *drift_value >= FEATURE_DRIFT_CRITICAL_THRESHOLD {
                    "CRITICAL"
                } else {
                    "WARN"
                }
            ),
        )
        .await?;
        alerts_created += 1;

        if severity == "CRITICAL" {
            max_severity = "CRITICAL".to_string();
        } else if max_severity == "OK" {
            max_severity = "WARN".to_string();
        }
    }

    // Prediction shift alert
    let severity = if drift_result.prediction_shift >= PREDICTION_SHIFT_CRITICAL_THRESHOLD {
        "CRITICAL"
    } else if drift_result.prediction_shift >= PREDICTION_SHIFT_WARN_THRESHOLD {
        "WARN"
    } else {
        "OK"
    };

    if severity != "OK" {
        alerts::create_alert(
            pool,
            project_id,
            baseline_version,
            severity,
            "PREDICTION_SHIFT",
            None,
            Some(drift_result.prediction_shift),
            &format!(
                "Prediction rate shift detected: {:.4} (baseline: {:.4}, incoming: {:.4})",
                drift_result.prediction_shift,
                drift_result.incoming_prediction_rate - drift_result.prediction_shift,
                drift_result.incoming_prediction_rate
            ),
        )
        .await?;
        alerts_created += 1;

        if severity == "CRITICAL" {
            max_severity = "CRITICAL".to_string();
        } else if max_severity == "OK" {
            max_severity = "WARN".to_string();
        }
    }

    Ok((alerts_created, max_severity))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_alert_thresholds() {
        assert_eq!(FEATURE_DRIFT_WARN_THRESHOLD, 0.10);
        assert_eq!(FEATURE_DRIFT_CRITICAL_THRESHOLD, 0.20);
        assert_eq!(PREDICTION_SHIFT_WARN_THRESHOLD, 0.10);
        assert_eq!(PREDICTION_SHIFT_CRITICAL_THRESHOLD, 0.20);
    }

    #[test]
    fn test_severity_determination() {
        // Test feature drift severity
        let warn_drift = 0.15;
        let critical_drift = 0.25;
        
        assert!(warn_drift >= FEATURE_DRIFT_WARN_THRESHOLD);
        assert!(warn_drift < FEATURE_DRIFT_CRITICAL_THRESHOLD);
        assert!(critical_drift >= FEATURE_DRIFT_CRITICAL_THRESHOLD);

        // Test prediction shift severity
        let warn_shift = 0.15;
        let critical_shift = 0.25;
        
        assert!(warn_shift >= PREDICTION_SHIFT_WARN_THRESHOLD);
        assert!(warn_shift < PREDICTION_SHIFT_CRITICAL_THRESHOLD);
        assert!(critical_shift >= PREDICTION_SHIFT_CRITICAL_THRESHOLD);
    }
}
