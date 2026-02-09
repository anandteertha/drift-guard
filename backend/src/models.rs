use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Project {
    pub project_id: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Baseline {
    pub baseline_id: String,
    pub project_id: String,
    pub baseline_version: i64,
    pub prediction_rate: f64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct BaselineFeature {
    pub feature_id: String,
    pub baseline_id: String,
    pub feature_name: String,
    pub feature_type: String, // "numeric" or "categorical"
    pub metadata: String,     // JSON string with histogram bins or frequency map
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BaselineMetadata {
    pub baseline_version: i64,
    pub prediction_rate: f64,
    pub created_at: DateTime<Utc>,
    pub features: Vec<FeatureMetadata>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureMetadata {
    pub name: String,
    pub feature_type: String,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Alert {
    pub alert_id: String,
    pub project_id: String,
    pub baseline_version: i64,
    pub created_at: DateTime<Utc>,
    pub severity: String,
    pub alert_type: String,
    pub feature_name: Option<String>,
    pub metric_value: Option<f64>,
    pub message: String,
    pub status: String, // "OPEN" or "ACK"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertFilter {
    pub status: Option<String>,
    pub severity: Option<String>,
    pub feature_name: Option<String>,
    pub alert_type: Option<String>,
    pub start_time: Option<String>, // ISO 8601 format
    pub end_time: Option<String>,   // ISO 8601 format
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadIncomingResponse {
    pub rows_processed: usize,
    pub alerts_created: usize,
    pub health: String, // "OK", "WARN", "CRITICAL"
}

#[derive(Debug, Clone)]
pub struct FeatureStats {
    pub name: String,
    pub feature_type: FeatureType,
    pub stats: FeatureStatsData,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FeatureType {
    Numeric,
    Categorical,
}

#[derive(Debug, Clone)]
pub enum FeatureStatsData {
    Numeric(NumericStats),
    Categorical(CategoricalStats),
}

#[derive(Debug, Clone)]
pub struct NumericStats {
    pub bins: Vec<f64>,          // bin edges (11 values for 10 bins)
    pub probabilities: Vec<f64>, // probabilities for each bin
}

#[derive(Debug, Clone)]
pub struct CategoricalStats {
    pub frequencies: std::collections::HashMap<String, f64>, // normalized frequencies
}
