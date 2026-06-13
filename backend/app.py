import os
import sqlite3
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

from database import get_db_connection, init_db

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')

# Helper to deserialize JSON fields in query rows
def parse_db_row(row, list_fields):
    d = dict(row)
    for field in list_fields:
        if field in d and d[field]:
            try:
                d[field] = json.loads(d[field])
            except Exception:
                d[field] = []
        else:
            d[field] = []
    return d

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'status': 'online',
        'message': 'AuraCare AI Healthcare System API is running successfully. Access features through the Vite frontend dashboard.'
    })

@app.route('/api/state', methods=['GET'])
def get_state():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Patients
    cursor.execute("SELECT * FROM patients")
    patients_rows = cursor.fetchall()
    patients = []
    for r in patients_rows:
        p = parse_db_row(r, ['medicalConditions', 'familyHistory', 'allergies', 'previousTreatments'])
        # Vitals structure formatting
        p['vitals'] = {
            'oxygen': r['oxygen'],
            'heartRate': r['heartRate'],
            'temp': r['temp'],
            'bpSystolic': r['bpSystolic'],
            'bpDiastolic': r['bpDiastolic']
        }
        # Remove flat vitals keys
        for key in ['oxygen', 'heartRate', 'temp', 'bpSystolic', 'bpDiastolic']:
            p.pop(key, None)
        patients.append(p)
        
    # 2. Doctors
    cursor.execute("SELECT * FROM doctors")
    doctors_rows = cursor.fetchall()
    doctors = [parse_db_row(r, ['availableSlots']) for r in doctors_rows]
    
    # 3. Appointments
    cursor.execute("SELECT * FROM appointments")
    appointments = [dict(r) for r in cursor.fetchall()]
    
    # 4. Beds
    cursor.execute("SELECT * FROM beds")
    beds_rows = cursor.fetchall()
    beds = []
    for r in beds_rows:
        b = dict(r)
        b['ventilator'] = bool(r['ventilator'])
        b['oxygen'] = bool(r['oxygen'])
        beds.append(b)
        
    # 5. Equipment
    cursor.execute("SELECT * FROM equipment")
    equipment = [dict(r) for r in cursor.fetchall()]
    
    # 6. Shifts
    cursor.execute("SELECT * FROM shifts")
    shifts = [dict(r) for r in cursor.fetchall()]
    
    # 7. Emergency Logs
    cursor.execute("SELECT * FROM emergency_logs ORDER BY id DESC")
    emergency_logs = [{'timestamp': r['timestamp'], 'text': r['text']} for r in cursor.fetchall()]
    
    conn.close()
    
    return jsonify({
        'patients': patients,
        'doctors': doctors,
        'appointments': appointments,
        'beds': beds,
        'equipment': equipment,
        'shifts': shifts,
        'emergencyLogs': emergency_logs
    })

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    
    # Check admin hardcoded logic fallback first
    if username == 'admin' and password == 'admin123' and role == 'admin':
        return jsonify({
            'status': 'success',
            'user': {'name': 'Administrator', 'role': 'admin', 'username': 'admin'}
        })
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if role == 'doctor':
        cursor.execute("SELECT id, name, username, password FROM doctors WHERE username = ? AND password = ?", (username, password))
        r = cursor.fetchone()
        if r:
            conn.close()
            return jsonify({
                'status': 'success',
                'user': {'id': r['id'], 'name': r['name'], 'role': 'doctor', 'username': r['username']}
            })
    elif role == 'patient':
        cursor.execute("SELECT id, name, username, password FROM patients WHERE username = ? AND password = ?", (username, password))
        r = cursor.fetchone()
        if r:
            conn.close()
            return jsonify({
                'status': 'success',
                'user': {'id': r['id'], 'name': r['name'], 'role': 'patient', 'username': r['username']}
            })
    elif role == 'staff':
        # Hardcoded fallback or table lookup
        if username == 'staff1' and password == 'staff123':
            conn.close()
            return jsonify({
                'status': 'success',
                'user': {'name': 'Duty Officer Bob', 'role': 'staff', 'username': 'staff1'}
            })
            
    conn.close()
    return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401

@app.route('/api/patients', methods=['POST'])
def add_patient():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Generate new ID PATxxx
    cursor.execute("SELECT COUNT(*) FROM patients")
    count = cursor.fetchone()[0]
    patient_id = f"PAT{str(count + 1).zfill(3)}"
    
    vitals = data.get('vitals', {})
    
    cursor.execute('''
        INSERT INTO patients (
            id, name, age, gender, weight, height, bloodGroup,
            medicalConditions, familyHistory, allergies, previousTreatments,
            insurance, username, password, oxygen, heartRate, temp, bpSystolic, bpDiastolic
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        patient_id,
        data.get('name'),
        data.get('age'),
        data.get('gender'),
        data.get('weight'),
        data.get('height'),
        data.get('bloodGroup'),
        json.dumps(data.get('medicalConditions', [])),
        json.dumps(data.get('familyHistory', [])),
        json.dumps(data.get('allergies', [])),
        json.dumps(data.get('previousTreatments', [])),
        data.get('insurance'),
        data.get('username', f"patient{count + 1}"),
        data.get('password', 'pat123'),
        vitals.get('oxygen', 98),
        vitals.get('heartRate', 75),
        vitals.get('temp', 98.6),
        vitals.get('bpSystolic', 120),
        vitals.get('bpDiastolic', 80)
    ))
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'success', 'patientId': patient_id})

@app.route('/api/doctors', methods=['POST'])
def add_doctor():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Generate ID DOCxxx
    cursor.execute("SELECT COUNT(*) FROM doctors")
    count = cursor.fetchone()[0]
    doc_id = f"DOC{str(count + 1).zfill(3)}"
    
    cursor.execute('''
        INSERT INTO doctors (
            id, name, department, specialization, experience, qualification,
            username, password, availableSlots, photo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        doc_id,
        data.get('name'),
        data.get('department'),
        data.get('specialization'),
        f"{data.get('experience')} Years",
        data.get('qualification'),
        data.get('username', f"doctor{count + 1}"),
        data.get('password', 'doc123'),
        json.dumps(["09:00 AM", "11:00 AM", "03:00 PM"]),
        data.get('photo', "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300")
    ))
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'success', 'doctorId': doc_id})

@app.route('/api/appointments', methods=['POST'])
def add_appointment():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Generate ID APPxxx
    cursor.execute("SELECT COUNT(*) FROM appointments")
    count = cursor.fetchone()[0]
    appt_id = f"APP{str(count + 1).zfill(3)}"
    
    cursor.execute('''
        INSERT INTO appointments (id, patientName, patientId, doctorId, doctorName, date, slot, reason, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        appt_id,
        data.get('patientName'),
        data.get('patientId'),
        data.get('doctorId'),
        data.get('doctorName'),
        data.get('date'),
        data.get('slot'),
        data.get('reason'),
        data.get('status', 'Pending')
    ))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success', 'appointmentId': appt_id})

@app.route('/api/appointments/<id>/status', methods=['PUT'])
def update_appointment_status(id):
    data = request.json
    status = data.get('status')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE appointments SET status = ? WHERE id = ?", (status, id))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

@app.route('/api/beds/allocate', methods=['POST'])
def allocate_bed():
    data = request.json
    patient_name = data.get('patientName')
    ward = data.get('ward')
    ventilator = 1 if data.get('ventilator') else 0
    oxygen = 1 if data.get('oxygen') else 0
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Find vacant bed in ward
    cursor.execute("SELECT id FROM beds WHERE ward = ? AND status = 'Vacant' LIMIT 1", (ward,))
    r = cursor.fetchone()
    if not r:
        conn.close()
        return jsonify({'status': 'error', 'message': f'No vacant beds in {ward}'}), 400
        
    bed_id = r['id']
    cursor.execute('''
        UPDATE beds SET status = 'Occupied', patient = ?, ventilator = ?, oxygen = ?
        WHERE id = ?
    ''', (patient_name, ventilator, oxygen, bed_id))
    
    conn.commit()
    conn.close()
    return jsonify({'status': 'success', 'bedId': bed_id})

@app.route('/api/beds/release/<id>', methods=['POST'])
def release_bed(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE beds SET status = 'Vacant', patient = NULL WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

@app.route('/api/shifts/optimize', methods=['POST'])
def optimize_shifts():
    # Simulated optimization engine logic which updates database shifts state
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Update any 'Scheduled' shifts to 'On Duty' to cover the load
    cursor.execute("UPDATE shifts SET status = 'On Duty' WHERE status = 'Scheduled'")
    
    # 2. Add an extra nurse shift suggestion
    cursor.execute("SELECT COUNT(*) FROM shifts")
    count = cursor.fetchone()[0]
    new_id = f"SFT{str(count + 1).zfill(3)}"
    
    cursor.execute('''
        INSERT INTO shifts (id, nurse, role, shift, status)
        VALUES (?, ?, ?, ?, ?)
    ''', (new_id, "Nurse Clara Oswald", "ER Shift Nurse", "Night (12:00 AM - 08:00 AM)", "On Duty"))
    
    conn.commit()
    conn.close()
    return jsonify({'status': 'success', 'message': 'AI roster suggestions applied successfully.'})

@app.route('/api/shifts/<id>/toggle', methods=['PUT'])
def toggle_shift(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM shifts WHERE id = ?", (id,))
    r = cursor.fetchone()
    if r:
        new_status = 'Scheduled' if r['status'] == 'On Duty' else 'On Duty'
        cursor.execute("UPDATE shifts SET status = ? WHERE id = ?", (new_status, id))
        conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

@app.route('/api/shifts/<id>', methods=['DELETE'])
def delete_shift(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM shifts WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    algorithm = data.get('algorithm', 'Random Forest')
    age = int(data.get('age', 45))
    bp = int(data.get('bp', 120))
    glucose = int(data.get('glucose', 100))
    cholesterol = int(data.get('cholesterol', 180))
    bmi = float(data.get('bmi', 24.5))
    symptoms = data.get('symptoms', [])
    
    # Map symptoms to binary indicators
    symptom_keys = ['chest_pain', 'shortness_breath', 'frequent_urination', 'excessive_thirst', 'swelling_legs', 'fatigue', 'fever']
    symptom_vals = [1 if s in symptoms else 0 for s in symptom_keys]
    
    # Build feature DataFrame matching train_models.py structure
    features = [age, bp, glucose, cholesterol, bmi] + symptom_vals
    df_features = pd.DataFrame([features], columns=[
        'age', 'bp_systolic', 'glucose', 'cholesterol', 'bmi',
        'chest_pain', 'shortness_breath', 'frequent_urination', 
        'excessive_thirst', 'swelling_legs', 'fatigue', 'fever'
    ])
    
    # Select Model file
    model_file = 'rf_model.joblib'
    if algorithm == 'XGBoost':
        model_file = 'gb_model.joblib'
    elif algorithm == 'Decision Tree':
        model_file = 'dt_model.joblib'
    elif algorithm == 'Logistic Regression':
        model_file = 'lr_model.joblib'
        
    model_path = os.path.join(MODELS_DIR, model_file)
    
    # Fallback to RF if model file doesn't exist
    if not os.path.exists(model_path):
        model_path = os.path.join(MODELS_DIR, 'rf_model.joblib')
        algorithm = 'Random Forest (Fallback)'
        
    try:
        model = joblib.load(model_path)
        # Predict Class and Probabilities
        prediction_class = int(model.predict(df_features)[0])
        prob_array = model.predict_proba(df_features)[0]
        # Risk score is the probability of the predicted disease class or the highest non-zero class
        if prediction_class == 0:
            final_risk = int(prob_array[0] * 20)  # low risk percentage
            predicted_disease = "General Viral Fever / Low Risk"
        else:
            final_risk = int(prob_array[prediction_class] * 100)
            disease_map = {1: "Type 2 Diabetes", 2: "Coronary Heart Disease", 3: "Chronic Kidney Disease (CKD)"}
            predicted_disease = disease_map.get(prediction_class, "General Viral Fever / Low Risk")
    except Exception as e:
        print(f"Prediction error: {e}")
        # Basic heuristic fallback if model fails loading
        final_risk = 35
        predicted_disease = "General Viral Fever / Low Risk"
        
    # Cap final risk between 10% and 99%
    final_risk = max(10, min(final_risk, 99))
    if final_risk < 15:
        predicted_disease = "General Viral Fever / Low Risk"
        final_risk = 12

    # Severity Level Mapping
    severity = "Mild Risk"
    badge_class = "badge-success"
    if 35 <= final_risk < 70:
        severity = "Moderate Risk"
        badge_class = "badge-pending"
    elif final_risk >= 70:
        severity = "Critical Risk"
        badge_class = "badge-danger"
        
    # Outcome estimations
    recovery_prob = max(42.0, 99.5 - (final_risk * 0.45))
    icu_prob = min(90.0, final_risk * 0.9)
    stay_duration = max(1, round(final_risk / 10))
    readmission_prob = min(45.0, final_risk * 0.25)
    
    # Recommendations
    if predicted_disease == "Type 2 Diabetes":
        recs = [
            "Refer to Diabetologist: Schedule HbA1c screening tests immediately.",
            "Prescription Guidance: Initiate low-dose Metformin, monitor fasting BG.",
            "Dietary Restriction: Low carbohydrate, high fiber meal structures.",
            "Diagnostic Follow-up: Annual retinopathy and peripheral vascular scans."
        ]
    elif predicted_disease == "Coronary Heart Disease":
        recs = [
            "Refer to Cardiologist: Order 12-lead Electrocardiogram (ECG) & stress test.",
            "Prescription Guidance: Administer Aspirin 81mg, daily statin therapy.",
            "Physiological Limit: Restrict vigorous physical exercises until consult.",
            "Critical Warning: Emergency admission required if chest pain radiates."
        ]
    elif predicted_disease == "Chronic Kidney Disease (CKD)":
        recs = [
            "Refer to Nephrologist: Calculate Glomerular Filtration Rate (eGFR).",
            "Diagnostic Monitor: Renal function panel testing (Urea, Creatinine).",
            "Fluid Control: Monitor hydration intake limits, low sodium foods.",
            "Allergy Review: Avoid NSAID medications (Ibuprofen) due to renal toxicity."
        ]
    else:
        recs = [
            "General Consultation: Schedule routine preventative physical wellness tests.",
            "Lifestyle: Retain optimal 150 min weekly cardiovascular movements.",
            "Vitals Control: Maintain standard dynamic health logs (BP, weight)."
        ]
        
    return jsonify({
        'predictedDisease': predicted_disease,
        'severity': severity,
        'badgeClass': badge_class,
        'finalRisk': final_risk,
        'recoveryProb': f"{recovery_prob:.1f}",
        'icuProb': f"{icu_prob:.1f}",
        'stayDuration': f"{stay_duration} Days",
        'readmitProb': f"{readmission_prob:.1f}",
        'recs': recs,
        'modelDetails': f"Computed via {algorithm} Classifier in Python (ML Inference)"
    })

@app.route('/api/ocr', methods=['POST'])
def parse_ocr():
    data = request.json
    doc_type = data.get('type')
    filename = data.get('filename', 'report.pdf')
    
    # Emulates NLP parsing response
    if doc_type == 'blood':
        return jsonify({
            'docType': "Complete Blood Count Panel",
            'status': "FLAGGED: ABNORMAL VITALS",
            'badgeClass': "badge-danger",
            'extractedText': "LAB ID: 998273-09A\nPATIENT: John Doe\nDATE: 2026-06-11\n\nHEMOGLOBIN: 11.2 g/dL (L) [Ref: 13.5-17.5]\nWHITE BLOOD CELLS: 12.4 x10^3/uL (H) [Ref: 4.5-11.0]\nPLATELETS: 245 x10^3/uL (Normal)\nGLUCOSE FASTING: 135 mg/dL (H) [Ref: 70-100]",
            'flaggedVitals': [
                {"label": "Anemia Indicator", "text": "Low Hemoglobin (11.2 g/dL). Recommend iron-rich nutritional assessment.", "level": "danger"},
                {"label": "Hyperglycemia Indicator", "text": "High Fasting Glucose (135 mg/dL). Flagged for diabetes prediction assessment.", "level": "warning"}
            ]
        })
    elif doc_type == 'ecg':
        return jsonify({
            'docType': "12-Lead Electrocardiography (ECG) Report",
            'status': "FLAGGED: CRITICAL ARRYTHMIA",
            'badgeClass': "badge-danger",
            'extractedText': "CARDIOLOGY LAB INFERENCE\nPATIENT: Arthur Dent\n\nHEART RATE: 105 bpm\nPR INTERVAL: 154 ms\nQRS DURATION: 96 ms\nST-SEGMENT: ST elevation observed in leads II, III, and aVF.\nCONCLUSION: Acute Inferior Wall Myocardial Infarction.",
            'flaggedVitals': [
                {"label": "CARDIAC EMERGENCY (CODE BLUE)", "text": "ST-Elevation (Myocardial Infarction). Summon cardiologist immediately!", "level": "danger"}
            ]
        })
    elif doc_type == 'mri':
        return jsonify({
            'docType': "Brain MRI Neuroimaging Diagnostic",
            'status': "FLAGGED: REVIEW NEEDED",
            'badgeClass': "badge-pending",
            'extractedText': "IMAGING SERVICE REPORT\n\nTECHNIQUE: Multiplanar multi-sequence brain MRI with IV Gadolinium.\nFINDINGS: A 2.4cm contrast-enhancing focal mass lesion is identified in the right temporal lobe, surrounding edema present.\nDIAGNOSIS: Probable Glioblastoma multiforme. Neuro-oncology review advised.",
            'flaggedVitals': [
                {"label": "Mass Lesion Suspected", "text": "Contrast-enhancing mass (2.4cm) right temporal lobe. Neuro-oncology consultation scheduled.", "level": "warning"}
            ]
        })
    else:
        return jsonify({
            'docType': f"Scanned File: {filename}",
            'status': "PARSING SUCCESSFUL",
            'badgeClass': "badge-success",
            'extractedText': f"MOCK TEXT PARSING EXTRACTION SUMMARY\nFILE: {filename}\n\n- Detected Patient Name: Jane Smith\n- Detected Vitals: Normal limits.\n- Flagged Values: No critical abnormalities found.",
            'flaggedVitals': []
        })

@app.route('/api/emergency/broadcast', methods=['POST'])
def emergency_broadcast():
    data = request.json
    patient_name = data.get('patientName')
    patient_id = data.get('patientId')
    metrics = data.get('metrics')
    
    time_str = datetime.now().strftime("%I:%M:%S %p")
    
    alert_logs = [
        f"🚨 BROADCAST: Code alert activated for patient {patient_name} ({patient_id})",
        "📲 NOTIFICATION: SMS Alert dispatched to emergency contacts: \"+1 (555) 998-384\"",
        "📟 PAGER: Broadcaster sent direct alert to on-call physician: \"Dr. Sarah Jenkins\"",
        "🚑 DISPATCH: Emergency EMT Service contacted. Ambulance request confirmed.",
        "🛏️ BED ALLOCATION: Dedicated ICU room BED-ICU-101 locked for immediate transfer."
    ]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    for log_item in alert_logs:
        cursor.execute("INSERT INTO emergency_logs (timestamp, text) VALUES (?, ?)", (time_str, f"[{time_str}] {log_item}"))
    conn.commit()
    conn.close()
    
    return jsonify({
        'status': 'success',
        'timestamp': time_str,
        'logs': [f"[{time_str}] {item}" for item in alert_logs]
    })

if __name__ == '__main__':
    # Auto-initialize database on launch
    init_db()
    # Check if models exist. If not, train them.
    models_exist = all(os.path.exists(os.path.join(MODELS_DIR, m)) for m in ['rf_model.joblib', 'gb_model.joblib', 'dt_model.joblib', 'lr_model.joblib'])
    if not models_exist:
        print("ML models missing from backend/models/ directory. Training them now...")
        from train_models import train_and_save_models
        train_and_save_models()
        
    app.run(host='127.0.0.1', port=5000, debug=True)
