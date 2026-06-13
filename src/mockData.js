export const initialDoctors = [
  {
    id: "DOC001",
    name: "Dr. Sarah Jenkins",
    department: "Cardiology",
    specialization: "Interventional Cardiology",
    experience: "14 Years",
    qualification: "MD, DM (Cardiology) - Johns Hopkins University",
    username: "doctor1",
    password: "doc123",
    availableSlots: ["09:00 AM", "10:30 AM", "11:15 AM", "02:00 PM", "04:30 PM"],
    photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300"
  },
  {
    id: "DOC002",
    name: "Dr. Marcus Vance",
    department: "Endocrinology",
    specialization: "Diabetology & Metabolic Disorders",
    experience: "10 Years",
    qualification: "MD, Fellow in Endocrinology - Stanford Medicine",
    username: "doctor2",
    password: "doc123",
    availableSlots: ["08:30 AM", "10:00 AM", "01:30 PM", "03:00 PM", "05:00 PM"],
    photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300"
  },
  {
    id: "DOC003",
    name: "Dr. Elena Rostova",
    department: "Nephrology",
    specialization: "Renal Replacement Therapy",
    experience: "12 Years",
    qualification: "MD, Ph.D. (Nephrology) - Heidelberg University",
    username: "doctor3",
    password: "doc123",
    availableSlots: ["09:30 AM", "11:00 AM", "02:30 PM", "03:45 PM", "04:15 PM"],
    photo: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300"
  },
  {
    id: "DOC004",
    name: "Dr. Alan Mercer",
    department: "Oncology",
    specialization: "Clinical & Radiation Oncology",
    experience: "18 Years",
    qualification: "MD (Oncology), MRCP (UK) - Oxford Medical School",
    username: "doctor4",
    password: "doc123",
    availableSlots: ["10:00 AM", "11:30 AM", "01:00 PM", "03:30 PM", "04:45 PM"],
    photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300"
  }
];

export const initialPatients = [
  {
    id: "PAT001",
    name: "John Doe",
    age: 45,
    gender: "Male",
    weight: 82,
    height: 178,
    bloodGroup: "A+",
    medicalConditions: ["Mild Hypertension"],
    familyHistory: ["Father: Type 2 Diabetes", "Grandmother: Heart Failure"],
    allergies: ["Penicillin", "Peanuts"],
    previousTreatments: ["Appendectomy (2018)"],
    insurance: "BlueShield Gold Premium (ID: BS-992384-A)",
    username: "patient1",
    password: "pat123",
    history: [
      { date: "2026-03-10", type: "Checkup", doctor: "Dr. Sarah Jenkins", diagnosis: "Controlled blood pressure", prescription: "Lisinopril 10mg once daily" },
      { date: "2026-05-14", type: "Lab Work", doctor: "Dr. Marcus Vance", diagnosis: "Pre-diabetic sugar markers", prescription: "Metformin 500mg (low dose), Diet advice" }
    ],
    vitals: { oxygen: 98, heartRate: 72, temp: 98.6, bpSystolic: 130, bpDiastolic: 85 }
  },
  {
    id: "PAT002",
    name: "Jane Smith",
    age: 34,
    gender: "Female",
    weight: 64,
    height: 165,
    bloodGroup: "O-",
    medicalConditions: ["Seasonal Asthma"],
    familyHistory: ["No history of chronic renal or cardiac illness"],
    allergies: ["Sulfa Drugs", "Shellfish"],
    previousTreatments: ["Laser Eye Surgery (2021)"],
    insurance: "Aetna Health Plus (ID: AE-8827-09B)",
    username: "patient2",
    password: "pat123",
    history: [
      { date: "2026-02-18", type: "ER Visit", doctor: "On-Call Staff", diagnosis: "Acute asthma bronchospasm", prescription: "Albuterol Inhaler (PRN), Prednisone 5-day cycle" }
    ],
    vitals: { oxygen: 94, heartRate: 88, temp: 99.1, bpSystolic: 118, bpDiastolic: 76 }
  }
];

export const initialBeds = [
  { id: "BED-ICU-101", ward: "ICU", label: "ICU Bed 1", status: "Occupied", patient: "John Doe", ventilator: true, oxygen: true },
  { id: "BED-ICU-102", ward: "ICU", label: "ICU Bed 2", status: "Vacant", patient: null, ventilator: true, oxygen: true },
  { id: "BED-ICU-103", ward: "ICU", label: "ICU Bed 3", status: "Reserved", patient: "Jane Smith", ventilator: false, oxygen: true },
  { id: "BED-ICU-104", ward: "ICU", label: "ICU Bed 4", status: "Vacant", patient: null, ventilator: false, oxygen: true },
  
  { id: "BED-EMG-201", ward: "Emergency", label: "Emergency Bed 1", status: "Occupied", patient: "Robert Miller", ventilator: false, oxygen: true },
  { id: "BED-EMG-202", ward: "Emergency", label: "Emergency Bed 2", status: "Vacant", patient: null, ventilator: false, oxygen: true },
  { id: "BED-EMG-203", ward: "Emergency", label: "Emergency Bed 3", status: "Vacant", patient: null, ventilator: false, oxygen: false },
  
  { id: "BED-GEN-301", ward: "General Ward A", label: "General Bed 1", status: "Occupied", patient: "Emily Watson", ventilator: false, oxygen: false },
  { id: "BED-GEN-302", ward: "General Ward A", label: "General Bed 2", status: "Occupied", patient: "Arthur Dent", ventilator: false, oxygen: false },
  { id: "BED-GEN-303", ward: "General Ward A", label: "General Bed 3", status: "Vacant", patient: null, ventilator: false, oxygen: false },
  { id: "BED-GEN-304", ward: "General Ward A", label: "General Bed 4", status: "Vacant", patient: null, ventilator: false, oxygen: false },

  { id: "BED-PED-401", ward: "Pediatric", label: "Pediatric Bed 1", status: "Vacant", patient: null, ventilator: false, oxygen: true },
  { id: "BED-PED-402", ward: "Pediatric", label: "Pediatric Bed 2", status: "Vacant", patient: null, ventilator: false, oxygen: false }
];

export const initialEquipment = [
  { name: "Ventilators", total: 12, allocated: 5, unit: "Units" },
  { name: "Oxygen Concentrators", total: 45, allocated: 18, unit: "Units" },
  { name: "MRI Scanner", total: 2, allocated: 1, unit: "Active Room" },
  { name: "CT Scanner", total: 3, allocated: 2, unit: "Active Room" },
  { name: "ECG Monitors", total: 25, allocated: 10, unit: "Units" }
];

export const initialStaffShifts = [
  { id: "SFT001", doctor: "Dr. Sarah Jenkins", role: "Cardiologist", shift: "Morning (08:00 AM - 04:00 PM)", status: "On Duty" },
  { id: "SFT002", doctor: "Dr. Marcus Vance", role: "Endocrinologist", shift: "Evening (04:00 PM - 12:00 AM)", status: "Scheduled" },
  { id: "SFT003", doctor: "Dr. Elena Rostova", role: "Nephrologist", shift: "Night (12:00 AM - 08:00 AM)", status: "Scheduled" },
  { id: "SFT004", doctor: "Dr. Alan Mercer", role: "Oncologist", shift: "Morning (08:00 AM - 04:00 PM)", status: "On Duty" },
  { id: "SFT005", nurse: "Nurse Sarah Connor", role: "ICU Head Nurse", shift: "Night (12:00 AM - 08:00 AM)", status: "Scheduled" },
  { id: "SFT006", nurse: "Nurse James Cole", role: "ER Nurse", shift: "Morning (08:00 AM - 04:00 PM)", status: "On Duty" },
  { id: "SFT007", nurse: "Nurse Clara Oswald", role: "General Ward Nurse", shift: "Evening (04:00 PM - 12:00 AM)", status: "Scheduled" }
];

export const initialAppointments = [
  { id: "APP101", patientName: "John Doe", patientId: "PAT001", doctorId: "DOC001", doctorName: "Dr. Sarah Jenkins", date: "2026-06-15", slot: "10:30 AM", reason: "Follow-up Cardiology Consult", status: "Approved" },
  { id: "APP102", patientName: "Jane Smith", patientId: "PAT002", doctorId: "DOC002", doctorName: "Dr. Marcus Vance", date: "2026-06-16", slot: "01:30 PM", reason: "HBA1c lab result check", status: "Pending" }
];

export const initialChatbotFaqs = [
  { keywords: ["hello", "hi", "hey"], response: "Hello! I am your AI Health Assistant. How can I help you today? You can ask me to 'check symptoms', 'list doctor specialties', or 'book an appointment'." },
  { keywords: ["symptom", "check", "cough", "fever", "headache"], response: "Please use our **AI Disease Prediction Module** for detailed diagnosis metrics. However, if you are experiencing general symptoms like mild fever or cough, make sure to drink plenty of fluids, rest, and keep track of your body temperature. If you have severe breathlessness, please visit the ER immediately." },
  { keywords: ["appointment", "book"], response: "To book an appointment, navigate to the **Appointment** section in the sidebar. Select your preferred doctor, choose a date and slot, and hit submit. The doctor will review and approve it shortly." },
  { keywords: ["bed", "icu", "ventilator"], response: "Hospital administrators and staff can monitor real-time bed and ICU availability in the **Bed Management** tab. It tracks open oxygen units, active ventilators, and current occupancy counts." },
  { keywords: ["emergency", "ambulance", "oxygen"], response: "If this is a critical emergency, trigger our **Emergency Alert Module** from the dashboard or sidebar. It will broadcast immediate alarms to on-call doctors, critical care nurses, and request an ambulance dispatch." }
];
