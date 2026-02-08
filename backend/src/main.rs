mod models;
mod routes;
mod services;
mod storage;
mod utils;

use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use sqlx::sqlite::SqlitePoolOptions;
use std::env;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize database
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:drift_guard.db".to_string());
    
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to create database pool");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    println!("Starting DriftGuard backend on http://127.0.0.1:8080");

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(cors)
            .route("/api/projects", web::post().to(routes::projects::create_project))
            .route("/api/projects", web::get().to(routes::projects::list_projects))
            .route("/api/projects/{project_id}", web::get().to(routes::projects::get_project))
            .route("/api/projects/{project_id}/baseline/upload", web::post().to(routes::baseline::upload_baseline))
            .route("/api/projects/{project_id}/baseline", web::get().to(routes::baseline::get_baseline))
            .route("/api/projects/{project_id}/incoming/upload", web::post().to(routes::incoming::upload_incoming))
            .route("/api/projects/{project_id}/alerts", web::get().to(routes::alerts::list_alerts))
            .route("/api/projects/{project_id}/alerts/{alert_id}/ack", web::post().to(routes::alerts::ack_alert))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}

