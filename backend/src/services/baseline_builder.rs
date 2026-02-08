use crate::models::FeatureStats;
use crate::storage::baselines;
use crate::utils::{build_baseline_stats, compute_prediction_rate, infer_feature_types, parse_csv};
use sqlx::SqlitePool;
use std::io::Read;

pub async fn build_baseline_from_csv<R: Read>(
    pool: &SqlitePool,
    project_id: &str,
    csv_reader: R,
) -> anyhow::Result<(i64, Vec<FeatureStats>)> {
    let (records, headers) = parse_csv(csv_reader)?;

    if records.is_empty() {
        return Err(anyhow::anyhow!("CSV file is empty"));
    }

    // Infer feature types
    let feature_types = infer_feature_types(&records, &headers);

    // Build baseline statistics
    let feature_stats = build_baseline_stats(&records, &headers, &feature_types);

    // Compute prediction rate
    let prediction_rate = compute_prediction_rate(&records);

    // Create baseline record
    let baseline = baselines::create_baseline(pool, project_id, prediction_rate).await?;

    // Store feature statistics
    for feature_stat in &feature_stats {
        let metadata_json = match &feature_stat.stats {
            crate::models::FeatureStatsData::Numeric(numeric) => {
                serde_json::json!({
                    "bins": numeric.bins,
                    "probabilities": numeric.probabilities
                })
            }
            crate::models::FeatureStatsData::Categorical(categorical) => {
                serde_json::json!({
                    "frequencies": categorical.frequencies
                })
            }
        };

        baselines::create_baseline_feature(
            pool,
            &baseline.baseline_id,
            &feature_stat.name,
            match feature_stat.feature_type {
                crate::models::FeatureType::Numeric => "numeric",
                crate::models::FeatureType::Categorical => "categorical",
            },
            &metadata_json.to_string(),
        )
        .await?;
    }

    Ok((baseline.baseline_version, feature_stats))
}

