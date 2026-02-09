use crate::models::{Alert, AlertFilter};
use chrono::Utc;
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

pub async fn create_alert(
    pool: &SqlitePool,
    params: &crate::models::CreateAlertParams,
) -> anyhow::Result<Alert> {
    let alert_id = Uuid::new_v4().to_string();
    let created_at = Utc::now();
    let created_at_str = created_at.to_rfc3339();
    let feature_name_ref = params.feature_name.as_deref();

    sqlx::query!(
        r#"
        INSERT INTO alerts (alert_id, project_id, baseline_version, created_at, severity, alert_type, feature_name, metric_value, message, status)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'OPEN')
        "#,
        alert_id,
        params.project_id,
        params.baseline_version,
        created_at_str,
        params.severity,
        params.alert_type,
        feature_name_ref,
        params.metric_value,
        params.message
    )
    .execute(pool)
    .await?;

    Ok(Alert {
        alert_id,
        project_id: params.project_id.clone(),
        baseline_version: params.baseline_version,
        created_at,
        severity: params.severity.clone(),
        alert_type: params.alert_type.clone(),
        feature_name: params.feature_name.clone(),
        metric_value: params.metric_value,
        message: params.message.clone(),
        status: "OPEN".to_string(),
    })
}

pub async fn list_alerts(
    pool: &SqlitePool,
    project_id: &str,
    filter: &AlertFilter,
) -> anyhow::Result<Vec<Alert>> {
    let mut query = String::from(
        r#"
        SELECT alert_id, project_id, baseline_version, created_at, severity, alert_type, feature_name, metric_value, message, status
        FROM alerts
        WHERE project_id = ?1
        "#,
    );

    let mut params: Vec<String> = vec![project_id.to_string()];
    let mut param_index = 2;

    if let Some(status) = &filter.status {
        query.push_str(&format!(" AND status = ?{}", param_index));
        params.push(status.clone());
        param_index += 1;
    }

    if let Some(severity) = &filter.severity {
        query.push_str(&format!(" AND severity = ?{}", param_index));
        params.push(severity.clone());
        param_index += 1;
    }

    if let Some(feature_name) = &filter.feature_name {
        query.push_str(&format!(" AND feature_name = ?{}", param_index));
        params.push(feature_name.clone());
        param_index += 1;
    }

    if let Some(alert_type) = &filter.alert_type {
        query.push_str(&format!(" AND alert_type = ?{}", param_index));
        params.push(alert_type.clone());
        param_index += 1;
    }

    if let Some(start_time) = &filter.start_time {
        query.push_str(&format!(" AND created_at >= ?{}", param_index));
        params.push(start_time.clone());
        param_index += 1;
    }

    if let Some(end_time) = &filter.end_time {
        query.push_str(&format!(" AND created_at <= ?{}", param_index));
        params.push(end_time.clone());
    }

    query.push_str(" ORDER BY created_at DESC");

    // Use query and manually map rows to avoid DateTime issues with dynamic queries
    let mut sql_query = sqlx::query(&query);
    for param in params {
        sql_query = sql_query.bind(param);
    }

    let rows = sql_query.fetch_all(pool).await?;
    let mut alerts = Vec::new();

    for row in rows {
        let created_at_str: String = row.get("created_at");
        let created_at = chrono::DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|e| anyhow::anyhow!("Failed to parse date: {}", e))?
            .with_timezone(&chrono::Utc);

        alerts.push(Alert {
            alert_id: row.get("alert_id"),
            project_id: row.get("project_id"),
            baseline_version: row.get("baseline_version"),
            created_at,
            severity: row.get("severity"),
            alert_type: row.get("alert_type"),
            feature_name: row.get("feature_name"),
            metric_value: row.get("metric_value"),
            message: row.get("message"),
            status: row.get("status"),
        });
    }

    Ok(alerts)
}

pub async fn ack_alert(pool: &SqlitePool, alert_id: &str) -> anyhow::Result<()> {
    sqlx::query!(
        r#"
        UPDATE alerts SET status = 'ACK' WHERE alert_id = ?1
        "#,
        alert_id
    )
    .execute(pool)
    .await?;

    Ok(())
}
