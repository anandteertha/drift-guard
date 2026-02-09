use crate::models::{Baseline, BaselineFeature};
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn create_baseline(
    pool: &SqlitePool,
    project_id: &str,
    prediction_rate: f64,
) -> anyhow::Result<Baseline> {
    // Get current max version for this project
    let max_version: Option<i64> = sqlx::query_scalar!(
        r#"
        SELECT MAX(baseline_version) FROM baselines WHERE project_id = ?1
        "#,
        project_id
    )
    .fetch_optional(pool)
    .await?
    .flatten();

    let baseline_version = max_version.unwrap_or(0) + 1;
    let baseline_id = Uuid::new_v4().to_string();
    let created_at = Utc::now();
    let created_at_str = created_at.to_rfc3339();

    sqlx::query!(
        r#"
        INSERT INTO baselines (baseline_id, project_id, baseline_version, prediction_rate, created_at)
        VALUES (?1, ?2, ?3, ?4, ?5)
        "#,
        baseline_id,
        project_id,
        baseline_version,
        prediction_rate,
        created_at_str
    )
    .execute(pool)
    .await?;

    Ok(Baseline {
        baseline_id,
        project_id: project_id.to_string(),
        baseline_version,
        prediction_rate,
        created_at,
    })
}

pub async fn get_latest_baseline(
    pool: &SqlitePool,
    project_id: &str,
) -> anyhow::Result<Option<Baseline>> {
    let row = sqlx::query!(
        r#"
        SELECT baseline_id, project_id, baseline_version, prediction_rate, created_at
        FROM baselines
        WHERE project_id = ?1
        ORDER BY baseline_version DESC
        LIMIT 1
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

        Ok(Some(Baseline {
            baseline_id: row.baseline_id.expect("baseline_id should not be null"),
            project_id: row.project_id,
            baseline_version: row.baseline_version,
            prediction_rate: row.prediction_rate,
            created_at,
        }))
    } else {
        Ok(None)
    }
}

pub async fn create_baseline_feature(
    pool: &SqlitePool,
    baseline_id: &str,
    feature_name: &str,
    feature_type: &str,
    metadata: &str,
) -> anyhow::Result<()> {
    let feature_id = Uuid::new_v4().to_string();

    sqlx::query!(
        r#"
        INSERT INTO baseline_features (feature_id, baseline_id, feature_name, feature_type, metadata)
        VALUES (?1, ?2, ?3, ?4, ?5)
        "#,
        feature_id,
        baseline_id,
        feature_name,
        feature_type,
        metadata
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn get_baseline_features(
    pool: &SqlitePool,
    baseline_id: &str,
) -> anyhow::Result<Vec<BaselineFeature>> {
    let rows = sqlx::query!(
        r#"
        SELECT feature_id, baseline_id, feature_name, feature_type, metadata
        FROM baseline_features
        WHERE baseline_id = ?1
        ORDER BY feature_name
        "#,
        baseline_id
    )
    .fetch_all(pool)
    .await?;

    let features = rows
        .into_iter()
        .map(|row| BaselineFeature {
            feature_id: row.feature_id.expect("feature_id should not be null"),
            baseline_id: row.baseline_id,
            feature_name: row.feature_name,
            feature_type: row.feature_type,
            metadata: row.metadata,
        })
        .collect();

    Ok(features)
}
