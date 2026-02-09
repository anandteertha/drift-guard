use crate::models::{FeatureStats, FeatureStatsData, FeatureType};
use crate::storage::baselines;
use crate::utils::{
    compute_feature_drift, compute_prediction_rate, compute_prediction_shift, parse_csv,
};
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::io::Read;

pub struct DriftResult {
    pub feature_drifts: HashMap<String, f64>,
    pub prediction_shift: f64,
    pub incoming_prediction_rate: f64,
}

pub async fn evaluate_drift<R: Read>(
    pool: &SqlitePool,
    project_id: &str,
    csv_reader: R,
) -> anyhow::Result<DriftResult> {
    // Get latest baseline
    let baseline = baselines::get_latest_baseline(pool, project_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("No baseline found for project"))?;

    let baseline_features = baselines::get_baseline_features(pool, &baseline.baseline_id).await?;

    // Parse incoming CSV
    let (incoming_records, _incoming_headers) = parse_csv(csv_reader)?;

    if incoming_records.is_empty() {
        return Err(anyhow::anyhow!("Incoming CSV is empty"));
    }

    // Reconstruct baseline feature stats
    let baseline_stats_map: HashMap<String, FeatureStats> = baseline_features
        .iter()
        .filter_map(|bf| {
            let metadata: serde_json::Value = serde_json::from_str(&bf.metadata).ok()?;
            let stats = match bf.feature_type.as_str() {
                "numeric" => {
                    let bins = metadata["bins"]
                        .as_array()?
                        .iter()
                        .filter_map(|v| v.as_f64())
                        .collect();
                    let probabilities = metadata["probabilities"]
                        .as_array()?
                        .iter()
                        .filter_map(|v| v.as_f64())
                        .collect();
                    FeatureStatsData::Numeric(crate::models::NumericStats {
                        bins,
                        probabilities,
                    })
                }
                "categorical" => {
                    let frequencies: HashMap<String, f64> = metadata["frequencies"]
                        .as_object()?
                        .iter()
                        .filter_map(|(k, v)| Some((k.clone(), v.as_f64()?)))
                        .collect();
                    FeatureStatsData::Categorical(crate::models::CategoricalStats { frequencies })
                }
                _ => return None,
            };

            Some((
                bf.feature_name.clone(),
                FeatureStats {
                    name: bf.feature_name.clone(),
                    feature_type: match bf.feature_type.as_str() {
                        "numeric" => FeatureType::Numeric,
                        _ => FeatureType::Categorical,
                    },
                    stats,
                },
            ))
        })
        .collect();

    // Compute feature drifts
    let mut feature_drifts = HashMap::new();
    for (feature_name, baseline_stat) in &baseline_stats_map {
        let incoming_values: Vec<String> = incoming_records
            .iter()
            .filter_map(|r| r.get(feature_name).cloned())
            .collect();

        let drift = compute_feature_drift(baseline_stat, &incoming_values);
        feature_drifts.insert(feature_name.clone(), drift);
    }

    // Compute prediction shift
    let incoming_prediction_rate = compute_prediction_rate(&incoming_records);
    let prediction_shift =
        compute_prediction_shift(baseline.prediction_rate, incoming_prediction_rate);

    Ok(DriftResult {
        feature_drifts,
        prediction_shift,
        incoming_prediction_rate,
    })
}
