use crate::models::Project;
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn create_project(pool: &SqlitePool, name: &str) -> anyhow::Result<Project> {
    let project_id = Uuid::new_v4().to_string();
    let created_at = Utc::now();
    let created_at_str = created_at.to_rfc3339();

    sqlx::query!(
        r#"
        INSERT INTO projects (project_id, name, created_at)
        VALUES (?1, ?2, ?3)
        "#,
        project_id,
        name,
        created_at_str
    )
    .execute(pool)
    .await?;

    Ok(Project {
        project_id,
        name: name.to_string(),
        created_at, // Return DateTime, not string
    })
}

pub async fn list_projects(pool: &SqlitePool) -> anyhow::Result<Vec<Project>> {
    let rows = sqlx::query!(
        r#"
        SELECT project_id, name, created_at
        FROM projects
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(pool)
    .await?;

    let mut projects = Vec::new();
    for row in rows {
        let created_at_str: String = row.created_at;
        let created_at = chrono::DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|e| anyhow::anyhow!("Failed to parse date: {}", e))?
            .with_timezone(&chrono::Utc);

        projects.push(Project {
            project_id: row.project_id.expect("project_id should not be null"),
            name: row.name,
            created_at,
        });
    }

    Ok(projects)
}

pub async fn get_project(pool: &SqlitePool, project_id: &str) -> anyhow::Result<Option<Project>> {
    let row = sqlx::query!(
        r#"
        SELECT project_id, name, created_at
        FROM projects
        WHERE project_id = ?1
        "#,
        project_id
    )
    .fetch_optional(pool)
    .await?;

    if let Some(row) = row {
        let created_at_str: String = row.created_at;
        let created_at = chrono::DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|e| anyhow::anyhow!("Failed to parse date: {}", e))?
            .with_timezone(&chrono::Utc);

        Ok(Some(Project {
            project_id: row.project_id.expect("project_id should not be null"),
            name: row.name,
            created_at,
        }))
    } else {
        Ok(None)
    }
}
