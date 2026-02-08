# Quick Start Guide

## Backend Setup

1. **Install Rust** (if not already installed):
   ```bash
   # Visit https://rustup.rs/ or use:
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Navigate to backend and run**:
   ```bash
   cd backend
   cargo run
   ```
   
   The backend will start on `http://127.0.0.1:8080`

## Frontend Setup

1. **Install Node.js** (v18+) if not already installed

2. **Navigate to frontend and install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```
   
   The frontend will be available at `http://localhost:4200`

## Testing the Application

1. **Start both services** (backend and frontend)

2. **Create a project**:
   - Go to `http://localhost:4200`
   - Enter a project name and click "Create Project"

3. **Upload baseline**:
   - Click the upload icon on your project
   - Upload `samples/baseline.csv`
   - You should see the baseline summary with features

4. **Upload incoming data**:
   - Click the cloud upload icon on your project
   - Upload `samples/incoming.csv`
   - You should see alerts generated (CRITICAL for income drift and prediction shift)

5. **View alerts**:
   - Click the notifications icon on your project
   - You should see the generated alerts with filtering options

## Troubleshooting

- **Backend won't start**: Make sure port 8080 is not in use
- **Frontend won't start**: Make sure port 4200 is not in use
- **Database errors**: Delete `drift_guard.db` and restart the backend
- **CORS errors**: Ensure backend is running and CORS is enabled (it should be by default)

