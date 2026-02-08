use crate::models::UploadIncomingResponse;
use crate::services::{alert_engine, drift_evaluator};
use crate::storage::baselines;
use crate::utils::parse_csv;
use actix_multipart::Multipart;
use actix_web::{web, HttpResponse, Responder};
use futures_util::TryStreamExt;
use sqlx::SqlitePool;
use std::io::Cursor;

pub async fn upload_incoming(
    pool: web::Data<SqlitePool>,
    path: web::Path<String>,
    mut payload: Multipart,
) -> impl Responder {
    let project_id = path.into_inner();

    // Verify project exists
    match crate::storage::projects::get_project(&pool, &project_id).await {
        Ok(Some(_)) => {}
        Ok(None) => {
            return HttpResponse::NotFound().json(serde_json::json!({
                "error": "Project not found"
            }));
        }
        Err(e) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": e.to_string()
            }));
        }
    }

    // Get latest baseline
    let baseline = match baselines::get_latest_baseline(&pool, &project_id).await {
        Ok(Some(b)) => b,
        Ok(None) => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "No baseline found. Please upload a baseline first."
            }));
        }
        Err(e) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": e.to_string()
            }));
        }
    };

    // Extract file from multipart
    let mut file_data = Vec::new();
    while let Ok(Some(mut field)) = payload.try_next().await {
        if field.name() == "file" {
            while let Ok(Some(chunk)) = field.try_next().await {
                file_data.extend_from_slice(&chunk);
            }
            break;
        }
    }

    if file_data.is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "No file provided"
        }));
    }

    // Parse incoming CSV to get headers
    let cursor_for_headers = Cursor::new(file_data.clone());
    let (incoming_records, incoming_headers) = match parse_csv(cursor_for_headers) {
        Ok(result) => result,
        Err(e) => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": format!("Failed to parse CSV: {}", e)
            }));
        }
    };

    let rows_processed = incoming_records.len();

    // Evaluate drift
    let cursor_for_drift = Cursor::new(file_data);
    let drift_result = match drift_evaluator::evaluate_drift(&pool, &project_id, cursor_for_drift).await {
        Ok(result) => result,
        Err(e) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Failed to evaluate drift: {}", e)
            }));
        }
    };

    // Reconstruct baseline features for alert generation
    let baseline_features_db = match baselines::get_baseline_features(&pool, &baseline.baseline_id).await {
        Ok(features) => features,
        Err(e) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Failed to get baseline features: {}", e)
            }));
        }
    };

    let baseline_features: Vec<crate::models::FeatureStats> = baseline_features_db
        .iter()
        .filter_map(|bf| {
            let metadata: serde_json::Value = serde_json::from_str(&bf.metadata).ok()?;
            let stats = match bf.feature_type.as_str() {
                "numeric" => {
                    let bins = metadata["bins"].as_array()?.iter().filter_map(|v| v.as_f64()).collect();
                    let probabilities = metadata["probabilities"].as_array()?.iter().filter_map(|v| v.as_f64()).collect();
                    crate::models::FeatureStatsData::Numeric(crate::models::NumericStats { bins, probabilities })
                }
                "categorical" => {
                    let frequencies: std::collections::HashMap<String, f64> = metadata["frequencies"]
                        .as_object()?
                        .iter()
                        .filter_map(|(k, v)| Some((k.clone(), v.as_f64()?)))
                        .collect();
                    crate::models::FeatureStatsData::Categorical(crate::models::CategoricalStats { frequencies })
                }
                _ => return None,
            };

            Some(crate::models::FeatureStats {
                name: bf.feature_name.clone(),
                feature_type: match bf.feature_type.as_str() {
                    "numeric" => crate::models::FeatureType::Numeric,
                    _ => crate::models::FeatureType::Categorical,
                },
                stats,
            })
        })
        .collect();

    // Generate alerts
    let (alerts_created, health) = match alert_engine::generate_alerts(
        &pool,
        &project_id,
        baseline.baseline_version,
        &drift_result,
        &baseline_features,
        &incoming_headers,
    )
    .await
    {
        Ok(result) => result,
        Err(e) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Failed to generate alerts: {}", e)
            }));
        }
    };

    HttpResponse::Ok().json(UploadIncomingResponse {
        rows_processed,
        alerts_created,
        health,
    })
}

