use crate::models::CreateProjectRequest;
use crate::storage::projects;
use actix_web::{web, HttpResponse, Responder};
use sqlx::SqlitePool;

pub async fn create_project(
    pool: web::Data<SqlitePool>,
    req: web::Json<CreateProjectRequest>,
) -> impl Responder {
    match projects::create_project(&pool, &req.name).await {
        Ok(project) => HttpResponse::Ok().json(project),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": e.to_string()
        })),
    }
}

pub async fn list_projects(pool: web::Data<SqlitePool>) -> impl Responder {
    match projects::list_projects(&pool).await {
        Ok(projects) => HttpResponse::Ok().json(projects),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": e.to_string()
        })),
    }
}

pub async fn get_project(pool: web::Data<SqlitePool>, path: web::Path<String>) -> impl Responder {
    let project_id = path.into_inner();
    match projects::get_project(&pool, &project_id).await {
        Ok(Some(project)) => HttpResponse::Ok().json(project),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({
            "error": "Project not found"
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": e.to_string()
        })),
    }
}
