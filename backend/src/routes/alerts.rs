use crate::models::AlertFilter;
use crate::storage::alerts;
use actix_web::{web, HttpResponse, Responder};
use sqlx::SqlitePool;

pub async fn list_alerts(
    pool: web::Data<SqlitePool>,
    path: web::Path<String>,
    query: web::Query<AlertFilter>,
) -> impl Responder {
    let project_id = path.into_inner();
    let filter = AlertFilter {
        status: query.status.clone(),
        severity: query.severity.clone(),
    };

    match alerts::list_alerts(&pool, &project_id, &filter).await {
        Ok(alerts_list) => HttpResponse::Ok().json(alerts_list),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": e.to_string()
        })),
    }
}

pub async fn ack_alert(
    pool: web::Data<SqlitePool>,
    path: web::Path<(String, String)>,
) -> impl Responder {
    let (_project_id, alert_id) = path.into_inner();

    match alerts::ack_alert(&pool, &alert_id).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "message": "Alert acknowledged"
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": e.to_string()
        })),
    }
}

