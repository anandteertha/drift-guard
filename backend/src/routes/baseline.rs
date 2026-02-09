use crate::models::BaselineMetadata;
use crate::services::baseline_builder;
use crate::storage::baselines;
use actix_multipart::Multipart;
use actix_web::{web, HttpResponse, Responder};
use futures_util::TryStreamExt;
use sqlx::SqlitePool;
use std::io::Cursor;

pub async fn upload_baseline(
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

    let cursor = Cursor::new(file_data);
    match baseline_builder::build_baseline_from_csv(&pool, &project_id, cursor).await {
        Ok((baseline_version, feature_stats)) => {
            // Get actual prediction rate from baseline
            if let Ok(Some(baseline)) = baselines::get_latest_baseline(&pool, &project_id).await {
                let features: Vec<_> = feature_stats
                    .iter()
                    .map(|fs| {
                        let metadata = match &fs.stats {
                            crate::models::FeatureStatsData::Numeric(n) => {
                                serde_json::json!({
                                    "bins": n.bins,
                                    "probabilities": n.probabilities
                                })
                            }
                            crate::models::FeatureStatsData::Categorical(c) => {
                                serde_json::json!({
                                    "frequencies": c.frequencies
                                })
                            }
                        };

                        crate::models::FeatureMetadata {
                            name: fs.name.clone(),
                            feature_type: match fs.feature_type {
                                crate::models::FeatureType::Numeric => "numeric".to_string(),
                                crate::models::FeatureType::Categorical => {
                                    "categorical".to_string()
                                }
                            },
                            metadata,
                        }
                    })
                    .collect();

                HttpResponse::Ok().json(serde_json::json!({
                    "baseline_version": baseline_version,
                    "prediction_rate": baseline.prediction_rate,
                    "features": features
                }))
            } else {
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Failed to retrieve created baseline"
                }))
            }
        }
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": e.to_string()
        })),
    }
}

pub async fn get_baseline(pool: web::Data<SqlitePool>, path: web::Path<String>) -> impl Responder {
    let project_id = path.into_inner();

    match baselines::get_latest_baseline(&pool, &project_id).await {
        Ok(Some(baseline)) => {
            match baselines::get_baseline_features(&pool, &baseline.baseline_id).await {
                Ok(features) => {
                    let feature_metadata: Vec<crate::models::FeatureMetadata> = features
                        .iter()
                        .map(|bf| {
                            let metadata: serde_json::Value =
                                serde_json::from_str(&bf.metadata).unwrap_or(serde_json::json!({}));
                            crate::models::FeatureMetadata {
                                name: bf.feature_name.clone(),
                                feature_type: bf.feature_type.clone(),
                                metadata,
                            }
                        })
                        .collect();

                    let metadata = BaselineMetadata {
                        baseline_version: baseline.baseline_version,
                        prediction_rate: baseline.prediction_rate,
                        created_at: baseline.created_at,
                        features: feature_metadata,
                    };

                    HttpResponse::Ok().json(metadata)
                }
                Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": e.to_string()
                })),
            }
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({
            "error": "No baseline found for this project"
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": e.to_string()
        })),
    }
}
