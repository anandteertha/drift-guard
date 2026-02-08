-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    project_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- Baselines table
CREATE TABLE IF NOT EXISTS baselines (
    baseline_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    baseline_version INTEGER NOT NULL,
    prediction_rate REAL NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- Baseline features table
CREATE TABLE IF NOT EXISTS baseline_features (
    feature_id TEXT PRIMARY KEY,
    baseline_id TEXT NOT NULL,
    feature_name TEXT NOT NULL,
    feature_type TEXT NOT NULL,
    metadata TEXT NOT NULL,
    FOREIGN KEY (baseline_id) REFERENCES baselines(baseline_id)
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    alert_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    baseline_version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    severity TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    feature_name TEXT,
    metric_value REAL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_baselines_project_id ON baselines(project_id);
CREATE INDEX IF NOT EXISTS idx_baseline_features_baseline_id ON baseline_features(baseline_id);
CREATE INDEX IF NOT EXISTS idx_alerts_project_id ON alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

