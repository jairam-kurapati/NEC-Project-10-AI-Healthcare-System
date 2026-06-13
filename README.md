# AuraCare | AI-Powered Healthcare System & Resource Planner

AuraCare is a modern, high-fidelity, and fully responsive hospital management dashboard featuring real-time diagnostic outcomes, clinical resource forecasting, medical report analysis, and emergency control centers.

This application is now backed by a **Python Flask API Server**, an **SQLite Database** for full data persistence, and **scikit-learn Machine Learning Models** for disease diagnostics.

---

## 🚀 Key Modules & Features

1. **Dashboard & Analytics**: Real-time visual tracking of key performance indicators (total active patients, occupancy rate, staff rosters, and pending slots).
2. **Patient Management & EHR**: Interactive Patient Dossiers containing clinical history, current vitals telemetry, allergies, and insurance data.
3. **Practitioner Directory**: Centralized directory tracking doctor departments, focus specializations, and daily available slots.
4. **Appointment Scheduler**: Online booking portal with a Doctor Approval workflow and role-based views.
5. **AI Disease & Outcome Predictor**: Runs real machine learning inference to compute disease risk probabilities, recovery rates, ICU requirements, and stay durations using 4 selectable algorithms.
6. **Bed & Resource Logistics**: Real-time bed allocation and auxiliary equipment link-tracking (ventilators, oxygen units) across ICU, General, Emergency, and Pediatric wards.
7. **Staff Scheduling**: Shift load planner suggesting roster changes based on predicted weekend peak inflows.
8. **Lab Report Document Parser (OCR)**: Scans and parses blood panels, ECG strips, or brain MRI documents, automatically extracting metadata and highlighting abnormal vitals.
9. **Emergency Control Center**: Broadcast emergency alerts immediately when a patient's vitals (e.g., O₂ saturation) degrade, paging active staff and calling for ambulance dispatches.

---

## 🛠️ Technology Stack

### Frontend Stack (Core UI & Logic)
*   **HTML5 & CSS3**: Designed using a clean custom CSS glassmorphism design language, with modern responsive grid layouts.
*   **Google Fonts**: Imported and styled using `Outfit` and `Inter` for clean typography.
*   **Lucide Icons**: Loaded dynamically via CDN for a consistent and professional vector icon system.
*   **Chart.js**: Powering all dynamic dashboards including Bed Inflow Forecasts, Equipment Allocation, and Staffing Load curves.
*   **JavaScript (ES6+)**: Handles user interactive UI routing, state updates, form submissions, and rule engines.

### Backend & Database Architecture
*   **Flask Web Server (Python)**: Exposes RESTful API endpoints at `http://127.0.0.1:5000` for authentication, patient records, bed allocation, and ML inference.
*   **SQLite Database (`backend/healthcare.db`)**: Manages relational tables for users, patients, doctors, beds, equipment, shifts, appointments, and emergency logs.
*   **ML Classifiers (scikit-learn)**: Multi-class classifiers trained on synthetic clinical datasets to predict diseases (Type 2 Diabetes, Coronary Heart Disease, Chronic Kidney Disease) and forecast ICU stay lengths.
*   **Resilient Fallback**: The frontend is built with an automatic fallback mechanism. If the Python API server is not running, the application gracefully falls back to browser `LocalStorage` (offline demo mode).

---

## 📦 Getting Started

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [Python (3.10+)](https://www.python.org/) installed.

### 2. Install Dependencies
Install the required frontend and backend packages:
```bash
# Frontend
npm install

# Backend
pip install -r backend/requirements.txt
```

### 3. Run the Backend (Flask API)
Launch the Python server. This will automatically train the ML models (if missing) and initialize the SQLite database:
```bash
python backend/app.py
```
*The API server will start on `http://127.0.0.1:5000`.*

### 4. Run the Frontend (Vite)
Launch the Vite development server:
```bash
npm run dev
```
Open the generated local URL (usually `http://localhost:5173`) in your web browser.

---

## 👤 Demo Accounts
You can log in to test different Role-Based Access Controls (RBAC):
*   **Administrator**: `admin` / `admin123` *(Full control of all modules)*
*   **Doctor**: `doctor1` / `doc123` *(Manage appointments and EHRs)*
*   **Patient**: `patient1` / `pat123` *(Check diagnosis forecasts, book slots, view personal dossier)*
*   **Hospital Staff**: `staff1` / `staff123` *(Manage beds and duty shifts)*
