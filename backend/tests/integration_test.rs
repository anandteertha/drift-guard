use drift_guard_backend::storage::projects;
use sqlx::sqlite::SqlitePoolOptions;

#[sqlx::test]
async fn test_create_project() {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .unwrap();

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .unwrap();

    let project = projects::create_project(&pool, "Test Project").await.unwrap();
    
    assert_eq!(project.name, "Test Project");
    assert!(!project.project_id.is_empty());
}

#[sqlx::test]
async fn test_list_projects() {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .unwrap();

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .unwrap();

    projects::create_project(&pool, "Project 1").await.unwrap();
    projects::create_project(&pool, "Project 2").await.unwrap();

    let all_projects = projects::list_projects(&pool).await.unwrap();
    assert_eq!(all_projects.len(), 2);
}
