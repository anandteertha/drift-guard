# DriftGuard v1

A minimal but production-shaped ML drift monitoring web application with Rust backend and Angular frontend.

## Overview

DriftGuard monitors data drift in machine learning systems by comparing incoming data batches against a baseline. It automatically detects:
- Feature distribution drift (numeric and categorical)
- Prediction rate shifts
- Schema validation issues

## Architecture

- **Backend**: Rust with Actix-web, SQLite for persistence
- **Frontend**: Angular 17 with Angular Material
- **Database**: SQLite (local file: `drift_guard.db`)

## Prerequisites

### Backend
- Rust (latest stable version)
- Cargo (comes with Rust)

### Frontend
- Node.js (v18 or later)
- npm (comes with Node.js)

## Setup & Running

### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Build and run:
```bash
cargo run
```

The backend will start on `http://127.0.0.1:8080`

The database will be automatically created and migrations will run on first startup.

### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:4200`

## CSV Format

### Required Columns
- `prediction`: Binary value (0 or 1)

### Optional Columns
- `confidence`: Numeric value between 0 and 1
- `timestamp`: ISO 8601 date string

### Feature Columns
All other columns are treated as features. Features can be:
- **Numeric**: Integer or float values
- **Categorical**: String values

### Example CSV

```csv
prediction,income,age,location,confidence
0,25000,25,urban,0.3
0,30000,28,urban,0.4
1,45000,35,suburban,0.6
```

## Drift Metrics

### Feature Drift

DriftGuard uses **L1 distance (normalized)** to measure distribution drift:

- For **numeric features**: Builds 10-bin histograms using min/max binning on the baseline. Compares baseline histogram probabilities against incoming data histogram probabilities using L1 distance, normalized to 0-1 range.

- For **categorical features**: Compares normalized frequency distributions between baseline and incoming data using L1 distance, normalized to 0-1 range.

**Formula**: `L1_distance = sum(|baseline_prob[i] - incoming_prob[i]|) / 2`

The division by 2 normalizes the result to a 0-1 range (since L1 distance for probability distributions ranges from 0 to 2).

### Prediction Rate Shift

Simple absolute difference: `|baseline_prediction_rate - incoming_prediction_rate|`

## Alert Thresholds

### Feature Drift
- **WARN**: drift > 0.10
- **CRITICAL**: drift > 0.20

### Prediction Rate Shift
- **WARN**: |delta| > 0.10
- **CRITICAL**: |delta| > 0.20

### Schema Validation
- **Missing required feature(s)**: CRITICAL
- **Extra feature(s)**: WARN
- **Type mismatches**: CRITICAL

## API Endpoints

### Projects
- `POST /api/projects` - Create a new project
- `GET /api/projects` - List all projects
- `GET /api/projects/{project_id}` - Get project details

### Baseline
- `POST /api/projects/{project_id}/baseline/upload` - Upload baseline CSV
- `GET /api/projects/{project_id}/baseline` - Get baseline metadata

### Incoming Data
- `POST /api/projects/{project_id}/incoming/upload` - Upload incoming CSV and trigger drift analysis

### Alerts
- `GET /api/projects/{project_id}/alerts?status=OPEN&severity=WARN` - List alerts with optional filters
- `POST /api/projects/{project_id}/alerts/{alert_id}/ack` - Acknowledge an alert

## Sample Data

Sample CSV files are provided in the `samples/` directory:
- `baseline.csv`: Baseline data with income mostly 20k-60k and prediction rate ~5%
- `incoming.csv`: Incoming data with income mostly 120k-200k and prediction rate ~100%

Uploading `incoming.csv` after `baseline.csv` should trigger:
- Feature drift alerts for `income` (CRITICAL)
- Prediction shift alert (CRITICAL)

## Usage Workflow

1. **Create a Project**: Use the Projects page to create a new project
2. **Upload Baseline**: Navigate to the project's baseline page and upload a baseline CSV
3. **Upload Incoming Data**: Navigate to the incoming upload page and upload new data batches
4. **View Alerts**: Check the alerts page to see drift detections and schema issues

## Database Schema

The SQLite database contains:
- `projects`: Project metadata
- `baselines`: Baseline versions and prediction rates
- `baseline_features`: Feature statistics (histograms/frequency maps)
- `alerts`: Generated alerts with severity and status

## Testing

### Backend Tests

Run Rust unit and integration tests:
```bash
cd backend
cargo test
```

### Frontend Tests

Run Angular unit tests:
```bash
cd frontend
npm test
```

For CI (headless):
```bash
npm run test:ci
```

### E2E Tests (Cypress with Gherkin)

Run Cypress E2E tests with Gherkin feature files:
```bash
cd frontend
npm run e2e          # Interactive mode
npm run e2e:headless # Headless mode
npm run e2e:ci       # CI mode
```

**Note**: E2E tests require both backend and frontend to be running:
1. Start the backend: `cd backend && cargo run`
2. Start the frontend: `cd frontend && npm start`
3. In another terminal, run: `cd frontend && npm run e2e`

Feature files are located in `frontend/cypress/e2e/`:
- `projects.feature` - Project management tests
- `baseline.feature` - Baseline upload tests
- `incoming.feature` - Incoming data and drift detection tests
- `alerts.feature` - Alerts management tests

## CI/CD

The project includes GitHub Actions workflows:

- **Backend CI** (`.github/workflows/backend.yml`): Runs Rust tests, formatting checks, and clippy
- **Frontend CI** (`.github/workflows/frontend.yml`): Runs Angular tests and builds the application

Both workflows trigger on pushes and pull requests to `main` and `develop` branches.

## Future Enhancements (v2+)

- Background workers for async processing
- Bounded queues for high-throughput scenarios
- Additional drift metrics (Jensen-Shannon divergence, KL divergence)
- Alert notification channels (email, webhooks)
- Metrics dashboard with time-series visualization
- Support for multiple baseline versions and comparison

## License

MIT
