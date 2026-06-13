import os
import sqlite3
import json

DB_FILE = os.path.join(os.path.dirname(__file__), 'healthcare.db')

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db_exists = os.path.exists(DB_FILE)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create Tables
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        weight REAL,
        height REAL,
        bloodGroup TEXT,
        medicalConditions TEXT, -- JSON Array
        familyHistory TEXT,     -- JSON Array
        allergies TEXT,         -- JSON Array
        previousTreatments TEXT, -- JSON Array
        insurance TEXT,
        username TEXT,
        password TEXT,
        oxygen INTEGER,
        heartRate INTEGER,
        temp REAL,
        bpSystolic INTEGER,
        bpDiastolic INTEGER
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS doctors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT,
        specialization TEXT,
        experience TEXT,
        qualification TEXT,
        username TEXT,
        password TEXT,
        availableSlots TEXT, -- JSON Array
        photo TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        patientName TEXT NOT NULL,
        patientId TEXT NOT NULL,
        doctorId TEXT NOT NULL,
        doctorName TEXT NOT NULL,
        date TEXT,
        slot TEXT,
        reason TEXT,
        status TEXT DEFAULT 'Pending'
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS beds (
        id TEXT PRIMARY KEY,
        ward TEXT NOT NULL,
        label TEXT NOT NULL,
        status TEXT NOT NULL,
        patient TEXT,
        ventilator INTEGER, -- Boolean (0 or 1)
        oxygen INTEGER      -- Boolean (0 or 1)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS equipment (
        name TEXT PRIMARY KEY,
        total INTEGER,
        allocated INTEGER,
        unit TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS shifts (
        id TEXT PRIMARY KEY,
        doctor TEXT,
        nurse TEXT,
        role TEXT,
        shift TEXT,
        status TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS emergency_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        text TEXT NOT NULL
    )
    ''')
    
    conn.commit()

    # If it's a new database, seed initial data
    # Check if users are seeded, if not, seed all tables
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        print("Database newly created. Seeding initial clinical data...")
        seed_data(conn)
        
    conn.close()

def seed_data(conn):
    cursor = conn.cursor()
    
    # 1. Seed Users (Demo Credentials)
    default_users = [
        ('admin', 'admin123', 'Administrator', 'admin'),
        ('doctor1', 'doc123', 'Dr. Sarah Jenkins', 'doctor'),
        ('doctor2', 'doc123', 'Dr. Marcus Vance', 'doctor'),
        ('doctor3', 'doc123', 'Dr. Elena Rostova', 'doctor'),
        ('doctor4', 'doc123', 'Dr. Alan Mercer', 'doctor'),
        ('patient1', 'pat123', 'John Doe', 'patient'),
        ('patient2', 'pat123', 'Jane Smith', 'patient'),
        ('staff1', 'staff123', 'Duty Officer Bob', 'staff')
    ]
    cursor.executemany("INSERT OR IGNORE INTO users (username, password, name, role) VALUES (?, ?, ?, ?)", default_users)
    
    # 2. Seed Doctors
    default_doctors = [
        ("DOC001", "Dr. Sarah Jenkins", "Cardiology", "Interventional Cardiology", "14 Years", "MD, DM (Cardiology) - Johns Hopkins University", "doctor1", "doc123", json.dumps(["09:00 AM", "10:30 AM", "11:15 AM", "02:00 PM", "04:30 PM"]), "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300"),
        ("DOC002", "Dr. Marcus Vance", "Endocrinology", "Diabetology & Metabolic Disorders", "10 Years", "MD, Fellow in Endocrinology - Stanford Medicine", "doctor2", "doc123", json.dumps(["08:30 AM", "10:00 AM", "01:30 PM", "03:00 PM", "05:00 PM"]), "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300"),
        ("DOC003", "Dr. Elena Rostova", "Nephrology", "Renal Replacement Therapy", "12 Years", "MD, Ph.D. (Nephrology) - Heidelberg University", "doctor3", "doc123", json.dumps(["09:30 AM", "11:00 AM", "02:30 PM", "03:45 PM", "04:15 PM"]), "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300"),
        ("DOC004", "Dr. Alan Mercer", "Oncology", "Clinical & Radiation Oncology", "18 Years", "MD (Oncology), MRCP (UK) - Oxford Medical School", "doctor4", "doc123", json.dumps(["10:00 AM", "11:30 AM", "01:00 PM", "03:30 PM", "04:45 PM"]), "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300")
    ]
    cursor.executemany("INSERT OR IGNORE INTO doctors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", default_doctors)
    
    # 3. Seed Patients
    default_patients = [
        ("PAT001", "John Doe", 45, "Male", 82, 178, "A+", 
         json.dumps(["Mild Hypertension"]), 
         json.dumps(["Father: Type 2 Diabetes", "Grandmother: Heart Failure"]), 
         json.dumps(["Penicillin", "Peanuts"]), 
         json.dumps(["Appendectomy (2018)"]), 
         "BlueShield Gold Premium (ID: BS-992384-A)", "patient1", "pat123", 98, 72, 98.6, 130, 85),
         
        ("PAT002", "Jane Smith", 34, "Female", 64, 165, "O-", 
         json.dumps(["Seasonal Asthma"]), 
         json.dumps(["No history of chronic renal or cardiac illness"]), 
         json.dumps(["Sulfa Drugs", "Shellfish"]), 
         json.dumps(["Laser Eye Surgery (2021)"]), 
         "Aetna Health Plus (ID: AE-8827-09B)", "patient2", "pat123", 94, 88, 99.1, 118, 76)
    ]
    cursor.executemany("INSERT OR IGNORE INTO patients VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", default_patients)
    
    # 4. Seed Beds
    default_beds = [
        ("BED-ICU-101", "ICU", "ICU Bed 1", "Occupied", "John Doe", 1, 1),
        ("BED-ICU-102", "ICU", "ICU Bed 2", "Vacant", None, 1, 1),
        ("BED-ICU-103", "ICU", "ICU Bed 3", "Reserved", "Jane Smith", 0, 1),
        ("BED-ICU-104", "ICU", "ICU Bed 4", "Vacant", None, 0, 1),
        ("BED-EMG-201", "Emergency", "Emergency Bed 1", "Occupied", "Robert Miller", 0, 1),
        ("BED-EMG-202", "Emergency", "Emergency Bed 2", "Vacant", None, 0, 1),
        ("BED-EMG-203", "Emergency", "Emergency Bed 3", "Vacant", None, 0, 0),
        ("BED-GEN-301", "General Ward A", "General Bed 1", "Occupied", "Emily Watson", 0, 0),
        ("BED-GEN-302", "General Ward A", "General Bed 2", "Occupied", "Arthur Dent", 0, 0),
        ("BED-GEN-303", "General Ward A", "General Bed 3", "Vacant", None, 0, 0),
        ("BED-GEN-304", "General Ward A", "General Bed 4", "Vacant", None, 0, 0),
        ("BED-PED-401", "Pediatric", "Pediatric Bed 1", "Vacant", None, 0, 1),
        ("BED-PED-402", "Pediatric", "Pediatric Bed 2", "Vacant", None, 0, 0)
    ]
    cursor.executemany("INSERT OR IGNORE INTO beds VALUES (?, ?, ?, ?, ?, ?, ?)", default_beds)
    
    # 5. Seed Equipment
    default_equipment = [
        ("Ventilators", 12, 5, "Units"),
        ("Oxygen Concentrators", 45, 18, "Units"),
        ("MRI Scanner", 2, 1, "Active Room"),
        ("CT Scanner", 3, 2, "Active Room"),
        ("ECG Monitors", 25, 10, "Units")
    ]
    cursor.executemany("INSERT OR IGNORE INTO equipment VALUES (?, ?, ?, ?)", default_equipment)
    
    # 6. Seed Shifts
    default_shifts = [
        ("SFT001", "Dr. Sarah Jenkins", None, "Cardiologist", "Morning (08:00 AM - 04:00 PM)", "On Duty"),
        ("SFT002", "Dr. Marcus Vance", None, "Endocrinologist", "Evening (04:00 PM - 12:00 AM)", "Scheduled"),
        ("SFT003", "Dr. Elena Rostova", None, "Nephrologist", "Night (12:00 AM - 08:00 AM)", "Scheduled"),
        ("SFT004", "Dr. Alan Mercer", None, "Oncologist", "Morning (08:00 AM - 04:00 PM)", "On Duty"),
        ("SFT005", None, "Nurse Sarah Connor", "ICU Head Nurse", "Night (12:00 AM - 08:00 AM)", "Scheduled"),
        ("SFT006", None, "Nurse James Cole", "ER Nurse", "Morning (08:00 AM - 04:00 PM)", "On Duty"),
        ("SFT007", None, "Nurse Clara Oswald", "General Ward Nurse", "Evening (04:00 PM - 12:00 AM)", "Scheduled")
    ]
    cursor.executemany("INSERT OR IGNORE INTO shifts VALUES (?, ?, ?, ?, ?, ?)", default_shifts)
    
    # 7. Seed Appointments
    default_appointments = [
        ("APP101", "John Doe", "PAT001", "DOC001", "Dr. Sarah Jenkins", "2026-06-15", "10:30 AM", "Follow-up Cardiology Consult", "Approved"),
        ("APP102", "Jane Smith", "PAT002", "DOC002", "Dr. Marcus Vance", "2026-06-16", "01:30 PM", "HBA1c lab result check", "Pending")
    ]
    cursor.executemany("INSERT OR IGNORE INTO appointments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", default_appointments)
    
    # 8. Seed Emergency Logs
    default_logs = [
        ("SYSTEM: AuraCare Core Initialization Complete.",),
        ("AI ENGINE: Heuristic Prediction Matrices Calibrated.",)
    ]
    # Fetch local timestamps
    import datetime
    now_str = datetime.datetime.now().strftime("%I:%M:%S %p")
    for text in default_logs:
        cursor.execute("INSERT INTO emergency_logs (timestamp, text) VALUES (?, ?)", (now_str, text[0]))
        
    conn.commit()
    print("Database seeding completed.")

if __name__ == '__main__':
    init_db()
