# AuraCare | AI-Powered Healthcare System & Resource Planner

AuraCare is a modern, high-fidelity, and fully responsive hospital management dashboard featuring real-time diagnostic outcomes, clinical resource forecasting, medical report analysis, and emergency control centers.

---

## 🚀 Key Modules & Features

1. **Dashboard & Analytics**: Real-time visual tracking of key performance indicators (total active patients, occupancy rate, staff rosters, and pending slots).
2. **Patient Management & EHR**: Interactive Patient Dossiers containing clinical history, current vitals telemetry, allergies, and insurance data.
3. **Practitioner Directory**: Centralized directory tracking doctor departments, focus specializations, and daily available slots.
4. **Appointment Scheduler**: Online booking portal with a Doctor Approval workflow and role-based views.
5. **AI Disease & Outcome Predictor**: Simulate disease risk probabilities, recovery rates, ICU requirements, and stay durations using simulated ML models (XGBoost, Random Forest, Decision Tree).
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
*   **Client-Side Simulation (Serverless)**: AuraCare is structured as a client-side Single Page Application (SPA). To make the app highly portable, fast, and easy to deploy:
    *   **No Remote Backend Server**: Instead of a traditional Node.js/Express or Python server, all business logic and model inferences are handled directly in the browser's JavaScript context.
    *   **In-Memory State**: Managed locally in a centralized state store within [src/main.js](file:///c:/Users/jayar/OneDrive/Desktop/Health%20care%20management%20system/src/main.js).
    *   **Local Persistence**: All modifications (new patients, modified shifts, booking statuses) persist locally in the user's browser using HTML5 **LocalStorage** (`localStorage.setItem`).
    *   **Initial Seed Data**: Bootstrapped from a static mock database schema in [src/mockData.js](file:///c:/Users/jayar/OneDrive/Desktop/Health%20care%20management%20system/src/mockData.js).

---

## 📦 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation
1. Clone or download the repository.
2. Open terminal in the directory and install dependencies:
   ```bash
   npm install
   ```

### Running Locally
To launch the Vite development server:
```bash
npm run dev
```
Open the generated local URL (usually `http://localhost:5173`) in your browser.

---

## 👤 Demo Accounts
You can log in to test different Role-Based Access Controls (RBAC):
*   **Administrator**: `admin` / `admin123` *(Full control of all modules)*
*   **Doctor**: `doctor1` / `doc123` *(Manage appointments and EHRs)*
*   **Patient**: `patient1` / `pat123` *(Check diagnosis forecasts, book slots, view personal dossier)*
*   **Hospital Staff**: `staff1` / `staff123` *(Manage beds and duty shifts)*
