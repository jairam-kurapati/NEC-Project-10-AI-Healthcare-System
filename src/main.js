import { 
  initialDoctors, 
  initialPatients, 
  initialBeds, 
  initialEquipment, 
  initialStaffShifts, 
  initialAppointments,
  initialChatbotFaqs 
} from './mockData.js';

// Application State
const state = {
  currentUser: null,
  currentRole: null,
  doctors: [],
  patients: [],
  beds: [],
  equipment: [],
  shifts: [],
  appointments: [],
  emergencyLogs: [],
  charts: {} // Store Chart.js instances to destroy them before re-creating
};

const API_BASE_URL = 'http://127.0.0.1:5000/api';
let usingFallback = false;

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`HTTP error ${res.status}: ${errText}`);
  }
  return await res.json();
}

// Initial Data Load from LocalStorage or mockData
async function initData() {
  try {
    const data = await apiFetch('/state');
    state.doctors = data.doctors;
    state.patients = data.patients;
    state.beds = data.beds;
    state.equipment = data.equipment;
    state.shifts = data.shifts;
    state.appointments = data.appointments;
    state.emergencyLogs = data.emergencyLogs;
    usingFallback = false;
    console.log("AuraCare backend connected. State loaded from SQLite.");
  } catch (err) {
    usingFallback = true;
    console.warn("Could not connect to AuraCare backend. Falling back to LocalStorage.", err);
    state.doctors = JSON.parse(localStorage.getItem('auc_doctors')) || initialDoctors;
    state.patients = JSON.parse(localStorage.getItem('auc_patients')) || initialPatients;
    state.beds = JSON.parse(localStorage.getItem('auc_beds')) || initialBeds;
    state.equipment = JSON.parse(localStorage.getItem('auc_equipment')) || initialEquipment;
    state.shifts = JSON.parse(localStorage.getItem('auc_shifts')) || initialStaffShifts;
    state.appointments = JSON.parse(localStorage.getItem('auc_appointments')) || initialAppointments;
    state.emergencyLogs = JSON.parse(localStorage.getItem('auc_emergency_logs')) || [
      { timestamp: new Date().toLocaleTimeString(), text: "SYSTEM: AuraCare Core Initialization Complete." },
      { timestamp: new Date().toLocaleTimeString(), text: "AI ENGINE: Heuristic Prediction Matrices Calibrated." }
    ];
    saveDataLocalOnly();
  }
}

function saveDataLocalOnly() {
  localStorage.setItem('auc_doctors', JSON.stringify(state.doctors));
  localStorage.setItem('auc_patients', JSON.stringify(state.patients));
  localStorage.setItem('auc_beds', JSON.stringify(state.beds));
  localStorage.setItem('auc_equipment', JSON.stringify(state.equipment));
  localStorage.setItem('auc_shifts', JSON.stringify(state.shifts));
  localStorage.setItem('auc_appointments', JSON.stringify(state.appointments));
  localStorage.setItem('auc_emergency_logs', JSON.stringify(state.emergencyLogs));
}

// App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  await initData();
  setupEventListeners();
  setupAuth();
  lucide.createIcons();
});

// Authentication and Access Control
function setupAuth() {
  const authOverlay = document.getElementById('auth-overlay');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const btnLogout = document.getElementById('btn-logout');

  // Toggle Login/Register tab views
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
  });

  // Handle Login Submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const role = document.getElementById('login-role').value;
    const username = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value;

    if (!usingFallback) {
      try {
        const res = await apiFetch('/login', {
          method: 'POST',
          body: JSON.stringify({ username, password: pass, role })
        });
        if (res.status === 'success') {
          loginUser(res.user);
          return;
        }
      } catch (err) {
        console.error("API Auth failed, attempting local fallback check", err);
      }
    }

    // Fallback authentication check
    if (username === 'admin' && pass === 'admin123') {
      loginUser({ name: 'Administrator', role: 'admin', username: 'admin' });
      return;
    }

    if (role === 'doctor') {
      const doc = state.doctors.find(d => d.username === username && d.password === pass);
      if (doc) {
        loginUser({ name: doc.name, role: 'doctor', username: doc.username, id: doc.id });
        return;
      }
    }

    if (role === 'patient') {
      const pat = state.patients.find(p => p.username === username && p.password === pass);
      if (pat) {
        loginUser({ name: pat.name, role: 'patient', username: pat.username, id: pat.id });
        return;
      }
    }

    if (role === 'staff') {
      if (username === 'staff1' && pass === 'staff123') {
        loginUser({ name: 'Duty Officer Bob', role: 'staff', username: 'staff1' });
        return;
      }
    }

    alert('Invalid credentials! Try: admin / admin123, doctor1 / doc123, or patient1 / pat123');
  });

  // Handle Registration
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const role = document.getElementById('reg-role').value;
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!usingFallback) {
      try {
        if (role === 'patient') {
          const res = await apiFetch('/patients', {
            method: 'POST',
            body: JSON.stringify({
              name,
              age: 30,
              gender: "Male",
              weight: 70,
              height: 170,
              bloodGroup: "O+",
              medicalConditions: [],
              familyHistory: [],
              allergies: [],
              previousTreatments: [],
              insurance: "Standard Policy ID: GL-112",
              username,
              password,
              vitals: { oxygen: 98, heartRate: 75, temp: 98.6, bpSystolic: 120, bpDiastolic: 80 }
            })
          });
          if (res.status === 'success') {
            await initData();
            loginUser({ name, role: 'patient', username, id: res.patientId });
            return;
          }
        } else if (role === 'doctor') {
          const res = await apiFetch('/doctors', {
            method: 'POST',
            body: JSON.stringify({
              name,
              department: "General Care",
              specialization: "General Practice",
              experience: "5",
              qualification: "MD Clinical Medicine",
              username,
              password,
              photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300"
            })
          });
          if (res.status === 'success') {
            await initData();
            loginUser({ name, role: 'doctor', username, id: res.doctorId });
            return;
          }
        }
      } catch (err) {
        console.error("API Register failed, using fallback check", err);
      }
    }

    // Fallback Registration Check
    if (role === 'patient') {
      const exists = state.patients.some(p => p.username === username);
      if (exists) { return alert('Username already registered!'); }
      
      const newPatient = {
        id: `PAT${String(state.patients.length + 1).padStart(3, '0')}`,
        name,
        age: 30,
        gender: "Male",
        weight: 70,
        height: 170,
        bloodGroup: "O+",
        medicalConditions: [],
        familyHistory: [],
        allergies: [],
        previousTreatments: [],
        insurance: "Standard Policy ID: GL-112",
        username,
        password,
        history: [],
        vitals: { oxygen: 98, heartRate: 75, temp: 98.6, bpSystolic: 120, bpDiastolic: 80 }
      };

      state.patients.push(newPatient);
      saveDataLocalOnly();
      loginUser({ name: newPatient.name, role: 'patient', username: newPatient.username, id: newPatient.id });
    } else if (role === 'doctor') {
      const exists = state.doctors.some(d => d.username === username);
      if (exists) { return alert('Username already registered!'); }

      const newDoc = {
        id: `DOC${String(state.doctors.length + 1).padStart(3, '0')}`,
        name,
        department: "General Care",
        specialization: "General Practice",
        experience: "5 Years",
        qualification: "MD Clinical Medicine",
        username,
        password,
        availableSlots: ["09:00 AM", "11:00 AM", "02:00 PM"],
        photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300"
      };

      state.doctors.push(newDoc);
      saveDataLocalOnly();
      loginUser({ name: newDoc.name, role: 'doctor', username: newDoc.username, id: newDoc.id });
    } else {
      alert('Registration successful! Please login with your new credentials.');
      tabLogin.click();
    }
  });

  btnLogout.addEventListener('click', () => {
    state.currentUser = null;
    state.currentRole = null;
    authOverlay.classList.remove('hidden');
  });
}

function loginUser(user) {
  state.currentUser = user;
  state.currentRole = user.role;
  
  // Hide Auth Page
  document.getElementById('auth-overlay').classList.add('hidden');
  
  // Set profile info in UI
  document.getElementById('user-name').innerText = user.name;
  document.getElementById('user-role-badge').innerText = user.role;
  document.getElementById('user-avatar').innerText = user.name.charAt(0);

  // Apply Role-Based Access Controls (RBAC) to navigation views
  applyRBAC();

  // Load defaults
  switchView('dashboard');
  
  // Refresh layout
  renderAllViews();
}

function applyRBAC() {
  const links = document.querySelectorAll('.sidebar-nav .nav-link');
  links.forEach(link => {
    const viewName = link.getAttribute('data-view');
    link.style.display = 'flex'; // Default show

    if (state.currentRole === 'patient') {
      // Patient restricted navigation
      const patientAllowed = ['dashboard', 'patients', 'appointments', 'ai-predictions', 'reports'];
      if (!patientAllowed.includes(viewName)) {
        link.style.display = 'none';
      }
    } else if (state.currentRole === 'doctor') {
      // Doctor restricted navigation (cannot see direct report creation but can see analyzer)
    } else if (state.currentRole === 'staff') {
      // Staff restricted navigation (cannot run predictions, but can manage beds/shifts)
      const staffAllowed = ['dashboard', 'beds', 'staff', 'ocr', 'emergency'];
      if (!staffAllowed.includes(viewName)) {
        link.style.display = 'none';
      }
    }
  });
}

// Global Event Listeners
function setupEventListeners() {
  // Navigation Sidebar Link clicks
  const links = document.querySelectorAll('.sidebar-nav .nav-link');
  links.forEach(link => {
    link.addEventListener('click', () => {
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      switchView(link.getAttribute('data-view'));
    });
  });

  // Floating Chatbot triggers
  const chatTrigger = document.getElementById('chatbot-trigger');
  const chatPanel = document.getElementById('chatbot-panel');
  const chatClose = document.getElementById('btn-close-chatbot');
  const chatForm = document.getElementById('chatbot-input-form');

  chatTrigger.addEventListener('click', () => {
    chatPanel.classList.toggle('active');
  });

  chatClose.addEventListener('click', () => {
    chatPanel.classList.remove('active');
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chatbot-input');
    const msg = input.value.trim();
    if (msg) {
      window.sendChatMsg(msg);
      input.value = '';
    }
  });

  // Emergency triggers
  document.getElementById('btn-quick-emergency').addEventListener('click', () => {
    switchView('emergency');
    // Set default fields to speed up user demonstration
    document.getElementById('emg-patient').selectedIndex = 0;
    document.getElementById('emg-criteria').selectedIndex = 0;
    document.getElementById('emg-metrics').value = "O2 Level: 84%, Heart Rate: 106 bpm (Hypoxia Warning)";
  });

  document.getElementById('btn-dismiss-emergency').addEventListener('click', () => {
    document.getElementById('emergency-banner').classList.remove('active');
  });

  // Ward bed filters
  const bedFilters = document.querySelectorAll('[data-ward-filter]');
  bedFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      bedFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderBeds(btn.getAttribute('data-ward-filter'));
    });
  });

  // Register Forms submissions
  document.getElementById('patient-registration-form').addEventListener('submit', handleEHRRegister);
  document.getElementById('doctor-registration-form').addEventListener('submit', handleDoctorRegister);
  document.getElementById('appointment-booking-form').addEventListener('submit', handleAppointmentBook);
  document.getElementById('disease-prediction-form').addEventListener('submit', handleDiseasePrediction);
  document.getElementById('emergency-bed-form').addEventListener('submit', handleEmergencyBedAssign);
  document.getElementById('btn-run-shift-optimization').addEventListener('click', runShiftOptimization);
  document.getElementById('emergency-broadcast-form').addEventListener('submit', handleEmergencyBroadcast);

  // File OCR mock triggers
  document.getElementById('btn-sim-blood').addEventListener('click', () => simulateOCR('blood'));
  document.getElementById('btn-sim-ecg').addEventListener('click', () => simulateOCR('ecg'));
  document.getElementById('btn-sim-mri').addEventListener('click', () => simulateOCR('mri'));
  document.getElementById('dropzone-ocr').addEventListener('click', () => {
    document.getElementById('ocr-file-input').click();
  });
  document.getElementById('ocr-file-input').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      simulateOCR('custom', e.target.files[0].name);
    }
  });

  // Report printing
  document.getElementById('btn-print-report').addEventListener('click', () => {
    window.print();
  });
}

// View Routing Switcher
function switchView(viewName) {
  const panes = document.querySelectorAll('.view-pane');
  panes.forEach(pane => {
    pane.classList.remove('active');
    if (pane.id === `${viewName}-view` || pane.id === viewName) {
      pane.classList.add('active');
    }
  });

  // Adjust Titles
  const viewTitles = {
    'dashboard': { title: 'Dashboard & Analytics', sub: 'Real-time indicators and hospital status overview' },
    'patients': { title: 'EHR Database & Patient Management', sub: 'Clinical dossiers, medical histories, and diagnostics log' },
    'doctors': { title: 'Practitioner Directory', sub: 'Medical staff registrations and departments availability' },
    'appointments': { title: 'Online Appointment Scheduling', sub: 'Book and review medical consultations' },
    'ai-predictions': { title: 'AI Diagnostics & Outcome Forecasting', sub: 'Predict disease risk thresholds, stays, and ICU demands' },
    'beds': { title: 'Bed Allocation & Equipment Logistics', sub: 'Live bed statuses, ICU ventilators, and oxygen configurations' },
    'staff': { title: 'Staff Shift Management', sub: 'Plan shift cycles and optimize staff allocations' },
    'ocr': { title: 'Lab Report Document Parser', sub: 'Extract values and flag abnormalities with OCR' },
    'emergency': { title: 'Emergency Alert Control Center', sub: 'Incident broadcasts and critical notifier logs' },
    'reports': { title: 'Reporting & Export Center', sub: 'Print operational statistics and occupancy reports' }
  };

  const titleNode = document.getElementById('view-title');
  const subNode = document.getElementById('view-subtitle');
  if (viewTitles[viewName]) {
    titleNode.innerText = viewTitles[viewName].title;
    subNode.innerText = viewTitles[viewName].sub;
  }

  // Update URL hash without reload
  history.replaceState(null, null, `#${viewName}`);

  // Re-render specifically triggered view properties if necessary
  if (viewName === 'dashboard') {
    renderCharts();
  }
}

// Master Render functions
function renderAllViews() {
  renderPatients();
  renderDoctors();
  renderAppointments();
  renderBeds('All');
  renderStaff();
  renderEmergencyLogs();
  updateDropdownOptions();
  updateDashboardCounters();
}

function updateDashboardCounters() {
  document.getElementById('count-patients').innerText = state.patients.length;
  
  const occupiedBeds = state.beds.filter(b => b.status === 'Occupied').length;
  const occupancyRate = Math.round((occupiedBeds / state.beds.length) * 100);
  document.getElementById('bed-occupancy-percent').innerText = `${occupancyRate}%`;

  const onDutyCount = state.shifts.filter(s => s.status === 'On Duty').length;
  document.getElementById('count-doctors-active').innerText = onDutyCount;

  const pendingAppts = state.appointments.filter(a => a.status === 'Pending').length;
  document.getElementById('count-appointments-pending').innerText = pendingAppts;
}

// EHR Rendering
function renderPatients() {
  const container = document.getElementById('table-patients-body');
  container.innerHTML = '';

  let visiblePatients = state.patients;
  if (state.currentRole === 'patient') {
    visiblePatients = state.patients.filter(p => p.username === state.currentUser.username);
  }

  visiblePatients.forEach(p => {
    const vitalsStr = `
      <div style="font-size: 11.5px; line-height: 1.4;">
        O₂: <strong style="color: ${p.vitals.oxygen < 92 ? '#f43f5e' : '#10b981'}">${p.vitals.oxygen}%</strong> | 
        HR: <strong>${p.vitals.heartRate} bpm</strong> <br>
        Temp: <strong>${p.vitals.temp}°F</strong> | 
        BP: <strong>${p.vitals.bpSystolic}/${p.vitals.bpDiastolic}</strong>
      </div>
    `;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 600; font-family: monospace;">${p.id}</td>
      <td>
        <div style="font-weight: 600;">${p.name}</div>
        <div style="font-size: 11px; color: var(--color-text-muted);">${p.insurance}</div>
      </td>
      <td>${p.age} Yrs / ${p.gender}</td>
      <td><span class="badge badge-info">${p.bloodGroup}</span></td>
      <td>${vitalsStr}</td>
      <td>${p.allergies.length ? p.allergies.join(', ') : 'None'}</td>
      <td>
        <button class="btn-secondary" onclick="window.viewEhrDetails('${p.id}')" style="font-size: 11px; padding: 6px 12px;">Dossier</button>
      </td>
    `;
    container.appendChild(tr);
  });
}

// Doctor Rendering
function renderDoctors() {
  const container = document.getElementById('table-doctors-body');
  container.innerHTML = '';

  state.doctors.forEach(d => {
    const slotsBadge = d.availableSlots.map(s => `
      <span style="font-size: 10px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 4px; padding: 2px 4px; color: #a5b4fc;">${s}</span>
    `).join(' ');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 600; font-family: monospace;">${d.id}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${d.photo}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--color-accent-teal);" alt="">
          <div style="font-weight: 600;">${d.name}</div>
        </div>
      </td>
      <td>
        <div style="font-weight: 500;">${d.department}</div>
        <div style="font-size: 11px; color: var(--color-text-muted);">${d.specialization}</div>
      </td>
      <td>${d.experience}</td>
      <td style="font-size: 12.5px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${d.qualification}">${d.qualification}</td>
      <td><div style="display:flex; flex-wrap:wrap; gap:4px;">${slotsBadge}</div></td>
    `;
    container.appendChild(tr);
  });
}

// Appointments Scheduling List
function renderAppointments() {
  const container = document.getElementById('table-appointments-body');
  container.innerHTML = '';

  let list = state.appointments;
  if (state.currentRole === 'patient') {
    list = state.appointments.filter(a => a.patientId === state.currentUser.id);
  } else if (state.currentRole === 'doctor') {
    list = state.appointments.filter(a => a.doctorId === state.currentUser.id);
  }

  list.forEach(a => {
    let statusClass = 'badge-pending';
    if (a.status === 'Approved') statusClass = 'badge-success';
    if (a.status === 'Cancelled') statusClass = 'badge-danger';

    let actionButtons = '';
    if (state.currentRole !== 'patient' && a.status === 'Pending') {
      actionButtons = `
        <button class="btn-secondary" onclick="window.updateApptStatus('${a.id}', 'Approved')" style="padding: 4px 8px; font-size: 11px; color: var(--color-accent-success); border-color: rgba(16,185,129,0.3);">Approve</button>
        <button class="btn-secondary" onclick="window.updateApptStatus('${a.id}', 'Cancelled')" style="padding: 4px 8px; font-size: 11px; color: var(--color-accent-danger); border-color: rgba(244,63,94,0.3);">Deny</button>
      `;
    } else if (a.status !== 'Cancelled') {
      actionButtons = `
        <button class="btn-secondary" onclick="window.updateApptStatus('${a.id}', 'Cancelled')" style="padding: 4px 8px; font-size: 11px; color: var(--color-accent-danger);">Cancel</button>
      `;
    } else {
      actionButtons = `<span style="font-size: 12px; color: var(--color-text-muted);">No Action</span>`;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 600; font-family: monospace;">${a.id}</td>
      <td style="font-weight: 600;">${a.patientName}</td>
      <td>${a.doctorName}</td>
      <td>
        <div style="font-weight: 500;">${a.date}</div>
        <div style="font-size: 11px; color: var(--color-text-muted);">${a.slot}</div>
      </td>
      <td style="max-width: 150px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${a.reason}">${a.reason}</td>
      <td><span class="badge ${statusClass}">${a.status}</span></td>
      <td><div style="display: flex; gap: 6px;">${actionButtons}</div></td>
    `;
    container.appendChild(tr);
  });
}

// Bed and Equipment management
function renderBeds(filterWard = 'All') {
  const container = document.getElementById('bed-config-grid');
  if (!container) return;
  container.innerHTML = '';

  let list = state.beds;
  if (filterWard !== 'All') {
    list = state.beds.filter(b => b.ward === filterWard);
  }

  list.forEach(b => {
    let stateClass = 'vacant';
    if (b.status === 'Occupied') stateClass = 'occupied';
    if (b.status === 'Reserved') stateClass = 'reserved';

    const div = document.createElement('div');
    div.className = `bed-card ${stateClass}`;
    div.innerHTML = `
      <div class="bed-header">
        <span class="bed-name">${b.label}</span>
        <span class="badge badge-${b.status === 'Occupied' ? 'danger' : b.status === 'Reserved' ? 'pending' : 'success'}" style="font-size: 9px; padding: 2px 6px;">${b.status}</span>
      </div>
      <div class="bed-details">
        <div>Ward: <strong>${b.ward}</strong></div>
        <div>Occupant: <strong>${b.patient || 'None'}</strong></div>
      </div>
      <div class="bed-features">
        <span class="feature-tag ${b.ventilator ? 'active' : ''}">Ventilator</span>
        <span class="feature-tag ${b.oxygen ? 'active' : ''}">Oxygen</span>
      </div>
      <div style="margin-top: 14px; display: flex; gap: 6px; justify-content: flex-end;">
        ${b.status !== 'Vacant' ? 
          `<button class="btn-secondary" onclick="window.releaseBed('${b.id}')" style="font-size: 10px; padding: 4px 8px; border-color: rgba(255,255,255,0.05);">Release</button>` : 
          `<button class="btn-secondary" onclick="window.quickAllocateBedDialog('${b.id}')" style="font-size: 10px; padding: 4px 8px; border-color: var(--color-accent-teal);">Assign</button>`
        }
      </div>
    `;
    container.appendChild(div);
  });
}

// Staff scheduling rosters
function renderStaff() {
  const container = document.getElementById('table-staff-body');
  if (!container) return;
  container.innerHTML = '';

  state.shifts.forEach(s => {
    let badgeClass = 'badge-success';
    if (s.status === 'Scheduled') badgeClass = 'badge-pending';
    if (s.status === 'On Leave') badgeClass = 'badge-danger';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 600; font-family: monospace;">${s.id}</td>
      <td style="font-weight: 600;">${s.doctor || s.nurse}</td>
      <td><span style="font-size:12.5px; color: var(--color-text-secondary);">${s.role}</span></td>
      <td>${s.shift}</td>
      <td><span class="badge ${badgeClass}">${s.status}</span></td>
      <td>
        <div style="display:flex; gap: 6px;">
          <button class="btn-secondary" onclick="window.toggleShiftStatus('${s.id}')" style="padding: 4px 8px; font-size:11px;">Toggle Status</button>
          <button class="btn-secondary" onclick="window.deleteShift('${s.id}')" style="padding:4px 8px; font-size:11px; color:var(--color-accent-danger); border-color: rgba(244,63,94,0.15)">Remove</button>
        </div>
      </td>
    `;
    container.appendChild(tr);
  });
}

// Dropdown synchronization
function updateDropdownOptions() {
  const patientSelects = ['appt-patient', 'pred-patient', 'reserve-patient', 'emg-patient'];
  patientSelects.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '';
    state.patients.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.innerText = `${p.name} (${p.id})`;
      select.appendChild(opt);
    });
  });

  const doctorSelect = document.getElementById('appt-doctor');
  if (doctorSelect) {
    doctorSelect.innerHTML = '';
    state.doctors.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.innerText = `${d.name} (${d.department})`;
      doctorSelect.appendChild(opt);
    });
    // Trigger slots change
    syncDoctorSlots();
    doctorSelect.removeEventListener('change', syncDoctorSlots);
    doctorSelect.addEventListener('change', syncDoctorSlots);
  }
}

function syncDoctorSlots() {
  const docSelect = document.getElementById('appt-doctor');
  const slotSelect = document.getElementById('appt-slot');
  if (!docSelect || !slotSelect) return;

  const doc = state.doctors.find(d => d.id === docSelect.value);
  slotSelect.innerHTML = '';
  if (doc && doc.availableSlots) {
    doc.availableSlots.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.innerText = s;
      slotSelect.appendChild(opt);
    });
  }
}

// Chart.js render configurations
function renderCharts() {
  // 1. Bed Inflow Forecast Chart
  const ctxBed = document.getElementById('chart-bed-forecast');
  if (ctxBed) {
    if (state.charts.bed) state.charts.bed.destroy();
    
    // Generate dates
    const labels = [];
    const actualInflow = [12, 19, 15, 22, 28, 25, 30];
    const aiForecast = [12, 18, 16, 24, 30, 27, 33];
    
    for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'}));
    }

    state.charts.bed = new Chart(ctxBed.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Actual Inflow',
            data: actualInflow,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.08)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          },
          {
            label: 'AI Forecasted Demand',
            data: aiForecast,
            borderColor: '#8b5cf6',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.4,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } }
        },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }

  // 2. Equipment utilization
  const ctxEquip = document.getElementById('chart-equipment-usage');
  if (ctxEquip) {
    if (state.charts.equip) state.charts.equip.destroy();
    
    const names = state.equipment.map(e => e.name);
    const allocated = state.equipment.map(e => e.allocated);
    const vacant = state.equipment.map(e => e.total - e.allocated);

    state.charts.equip = new Chart(ctxEquip.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: names,
        datasets: [{
          data: allocated,
          backgroundColor: ['#6366f1', '#0ea5e9', '#06b6d4', '#8b5cf6', '#10b981'],
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } }
        }
      }
    });
  }

  // 3. Staff loads Vs Inflow hours
  const ctxStaff = document.getElementById('chart-staff-loads');
  if (ctxStaff) {
    if (state.charts.staff) state.charts.staff.destroy();

    state.charts.staff = new Chart(ctxStaff.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['08:00 AM', '12:00 PM', '04:00 PM', '08:00 PM', '12:00 AM', '04:00 AM'],
        datasets: [
          {
            label: 'Shift Staff Load Count',
            data: [12, 10, 8, 12, 5, 4],
            backgroundColor: 'rgba(99, 102, 241, 0.65)',
            borderColor: '#6366f1',
            borderWidth: 1
          },
          {
            label: 'Forecast Patient Peak Inflow Weight',
            data: [8, 14, 11, 15, 7, 3],
            backgroundColor: 'rgba(244, 63, 94, 0.4)',
            borderColor: '#f43f5e',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#94a3b8' } }
        },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }
}

// EHR Form Submission
async function handleEHRRegister(e) {
  e.preventDefault();
  const name = document.getElementById('ehr-name').value.trim();
  const age = parseInt(document.getElementById('ehr-age').value);
  const gender = document.getElementById('ehr-gender').value;
  const blood = document.getElementById('ehr-blood').value;
  const weight = parseInt(document.getElementById('ehr-weight').value);
  const height = parseInt(document.getElementById('ehr-height').value);
  const conditions = document.getElementById('ehr-conditions').value.split(',').map(s => s.trim()).filter(Boolean);
  const allergies = document.getElementById('ehr-allergies').value.split(',').map(s => s.trim()).filter(Boolean);
  const family = document.getElementById('ehr-family-history').value.split(',').map(s => s.trim()).filter(Boolean);
  const insurance = document.getElementById('ehr-insurance').value.trim();

  if (!usingFallback) {
    try {
      const res = await apiFetch('/patients', {
        method: 'POST',
        body: JSON.stringify({
          name, age, gender, bloodGroup: blood, weight, height,
          medicalConditions: conditions, familyHistory: family, allergies,
          insurance, vitals: { oxygen: 98, heartRate: 75, temp: 98.6, bpSystolic: 120, bpDiastolic: 80 }
        })
      });
      if (res.status === 'success') {
        await initData();
        renderPatients();
        updateDropdownOptions();
        document.getElementById('patient-registration-form').reset();
        alert(`Patient dossier ${res.patientId} registered successfully in SQLite!`);
        return;
      }
    } catch (err) {
      console.error("API patient registration failed, using fallback", err);
    }
  }

  const newPatient = {
    id: `PAT${String(state.patients.length + 1).padStart(3, '0')}`,
    name,
    age,
    gender,
    weight,
    height,
    bloodGroup: blood,
    medicalConditions: conditions,
    familyHistory: family,
    allergies,
    previousTreatments: [],
    insurance,
    username: `patient${state.patients.length + 1}`,
    password: 'pat123',
    history: [],
    vitals: { oxygen: 98, heartRate: 75, temp: 98.6, bpSystolic: 120, bpDiastolic: 80 }
  };

  state.patients.push(newPatient);
  saveDataLocalOnly();
  renderPatients();
  updateDropdownOptions();
  document.getElementById('patient-registration-form').reset();
  alert(`Patient dossier ${newPatient.id} registered successfully (Local fallback)!`);
}

// Doctor Form Submission
async function handleDoctorRegister(e) {
  e.preventDefault();
  const name = document.getElementById('doc-name').value.trim();
  const dept = document.getElementById('doc-dept').value;
  const special = document.getElementById('doc-special').value.trim();
  const exp = parseInt(document.getElementById('doc-exp').value);
  const qual = document.getElementById('doc-qual').value.trim();

  if (!usingFallback) {
    try {
      const res = await apiFetch('/doctors', {
        method: 'POST',
        body: JSON.stringify({
          name, department: dept, specialization: special, experience: exp, qualification: qual
        })
      });
      if (res.status === 'success') {
        await initData();
        renderDoctors();
        updateDropdownOptions();
        document.getElementById('doctor-registration-form').reset();
        alert(`Doctor profile ${res.doctorId} created successfully in SQLite!`);
        return;
      }
    } catch (err) {
      console.error("API doctor registration failed, using fallback", err);
    }
  }

  const newDoc = {
    id: `DOC${String(state.doctors.length + 1).padStart(3, '0')}`,
    name,
    department: dept,
    specialization: special,
    experience: `${exp} Years`,
    qualification: qual,
    username: `doctor${state.doctors.length + 1}`,
    password: 'doc123',
    availableSlots: ["09:00 AM", "11:00 AM", "03:00 PM"],
    photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300"
  };

  state.doctors.push(newDoc);
  saveDataLocalOnly();
  renderDoctors();
  updateDropdownOptions();
  document.getElementById('doctor-registration-form').reset();
  alert(`Doctor profile ${newDoc.id} created successfully (Local fallback)!`);
}

// Appointment Slot Booking
async function handleAppointmentBook(e) {
  e.preventDefault();
  const patId = document.getElementById('appt-patient').value;
  const docId = document.getElementById('appt-doctor').value;
  const date = document.getElementById('appt-date').value;
  const slot = document.getElementById('appt-slot').value;
  const reason = document.getElementById('appt-reason').value.trim();

  const pat = state.patients.find(p => p.id === patId);
  const doc = state.doctors.find(d => d.id === docId);

  if (!usingFallback) {
    try {
      const res = await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientName: pat.name,
          patientId: patId,
          doctorId: docId,
          doctorName: doc.name,
          date,
          slot,
          reason,
          status: state.currentRole === 'patient' ? 'Pending' : 'Approved'
        })
      });
      if (res.status === 'success') {
        await initData();
        renderAppointments();
        updateDashboardCounters();
        document.getElementById('appointment-booking-form').reset();
        alert(`Appointment request ${res.appointmentId} submitted directly to SQLite!`);
        return;
      }
    } catch (err) {
      console.error("API appointment booking failed, using fallback", err);
    }
  }

  const newAppt = {
    id: `APP${String(state.appointments.length + 1).padStart(3, '0')}`,
    patientName: pat.name,
    patientId: patId,
    doctorId: docId,
    doctorName: doc.name,
    date,
    slot,
    reason,
    status: state.currentRole === 'patient' ? 'Pending' : 'Approved'
  };

  state.appointments.push(newAppt);
  saveDataLocalOnly();
  renderAppointments();
  updateDashboardCounters();
  document.getElementById('appointment-booking-form').reset();
  alert(`Appointment request ${newAppt.id} submitted (Local fallback)!`);
}

// AI Disease Risk calculations (Heuristic Inference engine)
async function handleDiseasePrediction(e) {
  e.preventDefault();
  const patId = document.getElementById('pred-patient').value;
  const algorithm = document.getElementById('pred-algorithm').value;
  const age = parseInt(document.getElementById('pred-age').value);
  const bp = parseInt(document.getElementById('pred-bp').value);
  const sugar = parseInt(document.getElementById('pred-sugar').value);
  const chol = parseInt(document.getElementById('pred-chol').value);
  const bmi = parseFloat(document.getElementById('pred-bmi').value);
  
  const selectedSymptoms = Array.from(document.getElementById('pred-symptoms').selectedOptions).map(opt => opt.value);

  let predictedDisease = "Healthy / Low Risk";
  let severity = "Mild Risk";
  let badgeClass = "badge-success";
  let finalRisk = 12;
  let recoveryProb = "99.5";
  let icuProb = "0.0";
  let stayDuration = "1 Days";
  let readmissionProb = "0.0";
  let recs = [];
  let modelDetails = `Computed via heuristic fallback in browser`;

  if (!usingFallback) {
    try {
      const res = await apiFetch('/predict', {
        method: 'POST',
        body: JSON.stringify({
          patientId: patId,
          algorithm,
          age,
          bp,
          glucose: sugar,
          cholesterol: chol,
          bmi,
          symptoms: selectedSymptoms
        })
      });
      predictedDisease = res.predictedDisease;
      severity = res.severity;
      badgeClass = res.badgeClass;
      finalRisk = res.finalRisk;
      recoveryProb = res.recoveryProb;
      icuProb = res.icuProb;
      stayDuration = res.stayDuration;
      readmissionProb = res.readmissionProb;
      recs = res.recs;
      modelDetails = res.modelDetails;
    } catch (err) {
      console.error("API disease prediction failed, using heuristic fallback", err);
      return runLocalHeuristicPrediction(patId, algorithm, age, bp, sugar, chol, bmi, selectedSymptoms);
    }
  } else {
    return runLocalHeuristicPrediction(patId, algorithm, age, bp, sugar, chol, bmi, selectedSymptoms);
  }

  renderPredictionUI(predictedDisease, severity, badgeClass, finalRisk, recoveryProb, icuProb, stayDuration, readmissionProb, recs, modelDetails);
}

function runLocalHeuristicPrediction(patId, algorithm, age, bp, sugar, chol, bmi, selectedSymptoms) {
  let diabetesWeight = 0;
  let heartWeight = 0;
  let kidneyWeight = 0;

  if (age > 45) { diabetesWeight += 10; heartWeight += 15; kidneyWeight += 10; }
  if (bp > 135) { heartWeight += 25; kidneyWeight += 20; }
  if (sugar > 110) { diabetesWeight += 35; kidneyWeight += 15; }
  if (chol > 210) { heartWeight += 30; }
  if (bmi > 25) { diabetesWeight += 20; heartWeight += 15; }

  selectedSymptoms.forEach(sym => {
    if (sym === 'chest_pain' || sym === 'shortness_breath') heartWeight += 40;
    if (sym === 'frequent_urination' || sym === 'excessive_thirst') diabetesWeight += 45;
    if (sym === 'swelling_legs') kidneyWeight += 40;
    if (sym === 'fatigue') { diabetesWeight += 10; heartWeight += 10; kidneyWeight += 10; }
  });

  let predictedDisease = "Healthy / Low Risk";
  let highestScore = 0;

  if (diabetesWeight > highestScore) { highestScore = diabetesWeight; predictedDisease = "Type 2 Diabetes"; }
  if (heartWeight > highestScore) { highestScore = heartWeight; predictedDisease = "Coronary Heart Disease"; }
  if (kidneyWeight > highestScore) { highestScore = kidneyWeight; predictedDisease = "Chronic Kidney Disease (CKD)"; }

  let modifier = 1.0;
  if (algorithm === "XGBoost") modifier = 0.96;
  if (algorithm === "Decision Tree") modifier = 1.05;
  if (algorithm === "Logistic Regression") modifier = 0.88;

  let finalRisk = Math.min(Math.round(highestScore * modifier), 99);
  if (finalRisk < 15) {
    predictedDisease = "General Viral Fever / Low Risk";
    finalRisk = 12;
  }

  let severity = "Mild Risk";
  let badgeClass = "badge-success";
  if (finalRisk >= 35 && finalRisk < 70) {
    severity = "Moderate Risk";
    badgeClass = "badge-pending";
  } else if (finalRisk >= 70) {
    severity = "Critical Risk";
    badgeClass = "badge-danger";
  }

  const recoveryProb = Math.max(99.5 - (finalRisk * 0.45), 42.0).toFixed(1);
  const icuProb = Math.min(finalRisk * 0.9, 90.0).toFixed(1);
  const stayDuration = Math.max(Math.round(finalRisk / 10), 1);
  const readmissionProb = Math.min(finalRisk * 0.25, 45.0).toFixed(1);

  let recs = [];
  if (predictedDisease === "Type 2 Diabetes") {
    recs = [
      "Refer to Diabetologist: Schedule HbA1c screening tests immediately.",
      "Prescription Guidance: Initiate low-dose Metformin, monitor fasting BG.",
      "Dietary Restriction: Low carbohydrate, high fiber meal structures.",
      "Diagnostic Follow-up: Annual retinopathy and peripheral vascular scans."
    ];
  } else if (predictedDisease === "Coronary Heart Disease") {
    recs = [
      "Refer to Cardiologist: Order 12-lead Electrocardiogram (ECG) & stress test.",
      "Prescription Guidance: Administer Aspirin 81mg, daily statin therapy.",
      "Physiological Limit: Restrict vigorous physical exercises until consult.",
      "Critical Warning: Emergency admission required if chest pain radiates."
    ];
  } else if (predictedDisease === "Chronic Kidney Disease (CKD)") {
    recs = [
      "Refer to Nephrologist: Calculate Glomerular Filtration Rate (eGFR).",
      "Diagnostic Monitor: Renal function panel testing (Urea, Creatinine).",
      "Fluid Control: Monitor hydration intake limits, low sodium foods.",
      "Allergy Review: Avoid NSAID medications (Ibuprofen) due to renal toxicity."
    ];
  } else {
    recs = [
      "General Consultation: Schedule routine preventative physical wellness tests.",
      "Lifestyle: Retain optimal 150 min weekly cardiovascular movements.",
      "Vitals Control: Maintain standard dynamic health logs (BP, weight)."
    ];
  }

  renderPredictionUI(predictedDisease, severity, badgeClass, finalRisk, recoveryProb, icuProb, `${stayDuration} Days`, readmissionProb, recs, `Computed via ${algorithm} (Heuristic Local Fallback)`);
}

function renderPredictionUI(predictedDisease, severity, badgeClass, finalRisk, recoveryProb, icuProb, stayDuration, readmissionProb, recs, modelDetails) {
  saveReportPredictionStats(predictedDisease, finalRisk);

  document.getElementById('outcome-input-placeholder').style.display = 'none';
  const outcomeResults = document.getElementById('outcome-results');
  outcomeResults.classList.add('visible');

  document.getElementById('predicted-disease-name').innerText = predictedDisease;
  const sevBadge = document.getElementById('predicted-severity-badge');
  sevBadge.innerText = severity;
  sevBadge.className = `badge ${badgeClass}`;
  
  document.getElementById('prediction-model-details').innerText = modelDetails;
  document.getElementById('predicted-risk-score').innerText = `${finalRisk}%`;
  document.getElementById('predicted-risk-score').style.color = severity === "Critical Risk" ? "var(--color-accent-danger)" : severity === "Moderate Risk" ? "var(--color-accent-warning)" : "var(--color-accent-success)";
  document.getElementById('disease-risk-fill').style.width = `${finalRisk}%`;

  document.getElementById('outcome-recovery-prob').innerText = `${recoveryProb}%`;
  document.getElementById('outcome-icu-prob').innerText = `${icuProb}%`;
  document.getElementById('outcome-stay-duration').innerText = stayDuration;
  document.getElementById('outcome-readmit-prob').innerText = `${readmissionProb}%`;

  const listRecs = document.getElementById('ai-treatment-recommendations');
  listRecs.innerHTML = recs.map(r => `<li>${r}</li>`).join('');
}

function saveReportPredictionStats(disease, risk) {
  // Save custom telemetry to report averages
  const avgStayEl = document.getElementById('report-avg-stay');
  if (avgStayEl) {
    const calculatedStay = Math.max(Math.round(risk / 10), 2);
    avgStayEl.innerText = `${((4.8 + calculatedStay) / 2).toFixed(1)} Days`;
  }
// Bed Assignment triggers
async function handleEmergencyBedAssign(e) {
  e.preventDefault();
  const patId = document.getElementById('reserve-patient').value;
  const ward = document.getElementById('reserve-ward').value;
  const vent = document.getElementById('reserve-ventilator').checked;
  const oxy = document.getElementById('reserve-oxygen').checked;

  const patient = state.patients.find(p => p.id === patId);

  if (!usingFallback) {
    try {
      const res = await apiFetch('/beds/allocate', {
        method: 'POST',
        body: JSON.stringify({
          patientName: patient.name,
          ward,
          ventilator: vent,
          oxygen: oxy
        })
      });
      if (res.status === 'success') {
        await initData();
        renderBeds('All');
        updateDashboardCounters();
        document.getElementById('emergency-bed-form').reset();
        alert(`Patient ${patient.name} allocated to bed via SQLite backend!`);
        return;
      }
    } catch (err) {
      console.error("API bed allocation failed, using fallback", err);
    }
  }

  // Look for vacant bed in ward
  const bed = state.beds.find(b => b.ward === ward && b.status === 'Vacant');
  if (!bed) {
    alert(`No vacant beds available in ${ward}! Free up or re-allocate existing patients.`);
    return;
  }

  bed.status = 'Occupied';
  bed.patient = patient.name;
  bed.ventilator = vent;
  bed.oxygen = oxy;

  saveDataLocalOnly();
  renderBeds('All');
  updateDashboardCounters();
  document.getElementById('emergency-bed-form').reset();
  alert(`Patient ${patient.name} allocated to ${bed.label} in ${ward} (Local fallback)!`);
}

// Shift scheduling suggestion optimizer
async function runShiftOptimization() {
  if (!usingFallback) {
    try {
      const res = await apiFetch('/shifts/optimize', { method: 'POST' });
      if (res.status === 'success') {
        await initData();
        renderStaff();
        updateDashboardCounters();
        document.getElementById('ai-optimization-alert').style.display = 'block';
        alert("AI Shift Scheduler Roster Updated in SQLite database!");
        return;
      }
    } catch (err) {
      console.error("API shift optimization failed, using fallback", err);
    }
  }

  document.getElementById('ai-optimization-alert').style.display = 'block';

  // Inject recommended staff shifts
  const docOnLeave = state.shifts.find(s => s.status === 'Scheduled');
  if (docOnLeave) {
    docOnLeave.status = 'On Duty';
  }

  // Create new shift suggestion
  const count = state.shifts.length + 1;
  const newShift = {
    id: `SFT${String(count).padStart(3, '0')}`,
    nurse: "Nurse Clara Oswald",
    role: "ER Shift Nurse",
    shift: "Night (12:00 AM - 08:00 AM)",
    status: "On Duty"
  };

  state.shifts.push(newShift);
  saveDataLocalOnly();
  renderStaff();
  updateDashboardCounters();
  alert("AI Shift Scheduler Roster Updated (Local fallback)!");
}

// OCR mock template analyzer
async function simulateOCR(type, filename = "") {
  document.getElementById('ocr-placeholder').style.display = 'none';
  const resultsDiv = document.getElementById('ocr-results');
  resultsDiv.style.display = 'block';

  const docTypeEl = document.getElementById('ocr-doc-type');
  const badgeEl = document.getElementById('ocr-status-badge');
  const textEl = document.getElementById('ocr-text-extracted');
  const vitalsDiv = document.getElementById('ocr-flagged-vitals');

  if (!usingFallback) {
    try {
      const res = await apiFetch('/ocr', {
        method: 'POST',
        body: JSON.stringify({ type, filename })
      });
      docTypeEl.innerText = res.docType;
      badgeEl.innerText = res.status;
      badgeEl.className = `badge ${res.badgeClass}`;
      textEl.value = res.extractedText;
      vitalsDiv.innerHTML = res.flaggedVitals.map(v => `
        <div style="background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.2); border-radius: 8px; padding: 10px; font-size:12.5px;">
          <strong style="color:var(--color-accent-danger);">${v.label}:</strong> ${v.text}
        </div>
      `).join('');
      return;
    } catch (err) {
      console.error("API OCR failed, using fallback", err);
    }
  }

  if (type === 'blood') {
    docTypeEl.innerText = "Complete Blood Count Panel";
    badgeEl.innerText = "FLAGGED: ABNORMAL VITALS";
    badgeEl.className = "badge badge-danger";
    textEl.value = `LAB ID: 998273-09A\nPATIENT: John Doe\nDATE: 2026-06-11\n\nHEMOGLOBIN: 11.2 g/dL (L) [Ref: 13.5-17.5]\nWHITE BLOOD CELLS: 12.4 x10^3/uL (H) [Ref: 4.5-11.0]\nPLATELETS: 245 x10^3/uL (Normal)\nGLUCOSE FASTING: 135 mg/dL (H) [Ref: 70-100]`;
    
    vitalsDiv.innerHTML = `
      <div style="background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.2); border-radius: 8px; padding: 10px; font-size:12.5px;">
        <strong style="color:var(--color-accent-danger);">Anemia Indicator:</strong> Low Hemoglobin (11.2 g/dL). Recommend iron-rich nutritional assessment.
      </div>
      <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; padding: 10px; font-size:12.5px;">
        <strong style="color:var(--color-accent-warning);">Hyperglycemia Indicator:</strong> High Fasting Glucose (135 mg/dL). Flagged for diabetes prediction assessment.
      </div>
    `;
  } else if (type === 'ecg') {
    docTypeEl.innerText = "12-Lead Electrocardiography (ECG) Report";
    badgeEl.innerText = "FLAGGED: CRITICAL ARRYTHMIA";
    badgeEl.className = "badge badge-danger";
    textEl.value = `CARDIOLOGY LAB INFERENCE\nPATIENT: Arthur Dent\n\nHEART RATE: 105 bpm\nPR INTERVAL: 154 ms\nQRS DURATION: 96 ms\nST-SEGMENT: ST elevation observed in leads II, III, and aVF.\nCONCLUSION: Acute Inferior Wall Myocardial Infarction.`;
    
    vitalsDiv.innerHTML = `
      <div style="background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.3); border-radius: 8px; padding: 10px; font-size:12.5px;">
        <strong style="color:var(--color-accent-danger);">CARDIAC EMERGERNCY (CODE BLUE):</strong> ST-Elevation (Myocardial Infarction). Summon cardiologist immediately!
      </div>
    `;
  } else if (type === 'mri') {
    docTypeEl.innerText = "Brain MRI Neuroimaging Diagnostic";
    badgeEl.innerText = "FLAGGED: REVIEW NEEDED";
    badgeEl.className = "badge badge-pending";
    textEl.value = `IMAGING SERVICE REPORT\n\nTECHNIQUE: Multiplanar multi-sequence brain MRI with IV Gadolinium.\nFINDINGS: A 2.4cm contrast-enhancing focal mass lesion is identified in the right temporal lobe, surrounding edema present.\nDIAGNOSIS: Probable Glioblastoma multiforme. Neuro-oncology review advised.`;
    
    vitalsDiv.innerHTML = `
      <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; padding: 10px; font-size:12.5px;">
        <strong style="color:var(--color-accent-warning);">Mass Lesion Suspected:</strong> Contrast-enhancing mass (2.4cm) right temporal lobe. Neuro-oncology consultation scheduled.
      </div>
    `;
  } else {
    // Custom file upload mock
    docTypeEl.innerText = `Scanned File: ${filename || 'report.pdf'}`;
    badgeEl.innerText = "PARSING SUCCESSFUL";
    badgeEl.className = "badge badge-success";
    textEl.value = `MOCK TEXT PARSING EXTRACTION SUMMARY\nFILE: ${filename}\n\n- Detected Patient Name: Jane Smith\n- Detected Vitals: Normal limits.\n- Flagged Values: No critical abnormalities found.`;
    vitalsDiv.innerHTML = `
      <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); border-radius: 8px; padding: 10px; font-size:12.5px; color: var(--color-accent-success);">
        <strong>No Abnormal Vitals Flagged:</strong> Patient indicators within target reference ranges.
      </div>
    `;
  }
}

// Emergency Alert triggers and Broadcast System
async function handleEmergencyBroadcast(e) {
  e.preventDefault();
  const patId = document.getElementById('emg-patient').value;
  const criteria = document.getElementById('emg-criteria').value;
  const metrics = document.getElementById('emg-metrics').value;

  const patient = state.patients.find(p => p.id === patId);
  const time = new Date().toLocaleTimeString();

  // Activate blinking header banner
  const banner = document.getElementById('emergency-banner');
  const bannerMsg = document.getElementById('emergency-banner-msg');
  banner.classList.add('active');
  bannerMsg.innerText = `CRITICAL ALERT: ${patient.name} - ${metrics}`;

  if (!usingFallback) {
    try {
      const res = await apiFetch('/emergency/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          patientName: patient.name,
          patientId: patId,
          metrics
        })
      });
      if (res.status === 'success') {
        await initData();
        renderEmergencyLogs();
        alert(`Emergency code broadcasted for ${patient.name} in SQLite!`);
        return;
      }
    } catch (err) {
      console.error("API emergency broadcast failed, using fallback", err);
    }
  }

  // Log SMS/Notifiers
  const logsContainer = document.getElementById('emg-logs-container');
  
  const alertLogs = [
    `[${time}] 🚨 BROADCAST: Code alert activated for patient ${patient.name} (${patient.id})`,
    `[${time}] 📲 NOTIFICATION: SMS Alert dispatched to emergency contacts: "+1 (555) 998-384"`,
    `[${time}] 📟 PAGER: Broadcaster sent direct alert to on-call physician: "Dr. Sarah Jenkins"`,
    `[${time}] 🚑 DISPATCH: Emergency EMT Service contacted. Ambulance request confirmed.`,
    `[${time}] 🛏️ BED ALLOCATION: Dedicated ICU room BED-ICU-101 locked for immediate transfer.`
  ];

  alertLogs.forEach(logText => {
    const div = document.createElement('div');
    div.className = 'emergency-log-item';
    div.innerHTML = `<span>${logText}</span>`;
    logsContainer.insertBefore(div, logsContainer.firstChild);

    // Save to local logs
    state.emergencyLogs.push({ timestamp: time, text: logText });
  });

  saveDataLocalOnly();
  alert(`Emergency code broadcasted for ${patient.name} (Local fallback)!`);
}

function renderEmergencyLogs() {
  const container = document.getElementById('emg-logs-container');
  if (!container) return;
  
  // Clear but keep first
  container.innerHTML = '';
  state.emergencyLogs.slice().reverse().forEach(log => {
    const div = document.createElement('div');
    div.className = 'emergency-log-item';
    div.innerHTML = `<span>[${log.timestamp}] ${log.text}</span>`;
    container.appendChild(div);
  });
}

// Global functions for inline click events
window.viewEhrDetails = function(patId) {
  const p = state.patients.find(pat => pat.id === patId);
  if (p) {
    alert(`Dossier Details for ${p.name} (${p.id})\n\nAge/Gender: ${p.age} Yrs / ${p.gender}\nBlood Group: ${p.bloodGroup}\nHeight/Weight: ${p.height}cm / ${p.weight}kg\nAllergies: ${p.allergies.join(', ') || 'None'}\nConditions: ${p.medicalConditions.join(', ') || 'None'}\nInsurance: ${p.insurance}`);
  }
};

window.updateApptStatus = async function(apptId, status) {
  if (!usingFallback) {
    try {
      const res = await apiFetch(`/appointments/${apptId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (res.status === 'success') {
        await initData();
        renderAppointments();
        updateDashboardCounters();
        return;
      }
    } catch (err) {
      console.error("API update appt status failed, using fallback", err);
    }
  }

  const appt = state.appointments.find(a => a.id === apptId);
  if (appt) {
    appt.status = status;
    saveDataLocalOnly();
    renderAppointments();
    updateDashboardCounters();
  }
};

window.releaseBed = async function(bedId) {
  const bed = state.beds.find(b => b.id === bedId);
  if (bed) {
    const confirmRelease = confirm(`Are you sure you want to release patient ${bed.patient} from bed ${bed.label}?`);
    if (confirmRelease) {
      if (!usingFallback) {
        try {
          const res = await apiFetch(`/beds/release/${bedId}`, { method: 'POST' });
          if (res.status === 'success') {
            await initData();
            renderBeds('All');
            updateDashboardCounters();
            return;
          }
        } catch (err) {
          console.error("API release bed failed, using fallback", err);
        }
      }

      bed.status = 'Vacant';
      bed.patient = null;
      saveDataLocalOnly();
      renderBeds('All');
      updateDashboardCounters();
    }
  }
};

window.quickAllocateBedDialog = function(bedId) {
  switchView('beds');
  document.getElementById('reserve-patient').selectedIndex = 0;
  // Match bed select with ward
  const bed = state.beds.find(b => b.id === bedId);
  const wardSelect = document.getElementById('reserve-ward');
  for (let i = 0; i < wardSelect.options.length; i++) {
    if (wardSelect.options[i].value === bed.ward) {
      wardSelect.selectedIndex = i;
      break;
    }
  }
};

window.toggleShiftStatus = async function(shiftId) {
  if (!usingFallback) {
    try {
      const res = await apiFetch(`/shifts/${shiftId}/toggle`, { method: 'PUT' });
      if (res.status === 'success') {
        await initData();
        renderStaff();
        updateDashboardCounters();
        return;
      }
    } catch (err) {
      console.error("API toggle shift failed, using fallback", err);
    }
  }

  const s = state.shifts.find(sf => sf.id === shiftId);
  if (s) {
    s.status = s.status === 'On Duty' ? 'Scheduled' : 'On Duty';
    saveDataLocalOnly();
    renderStaff();
    updateDashboardCounters();
  }
};

window.deleteShift = async function(shiftId) {
  if (!usingFallback) {
    try {
      const res = await apiFetch(`/shifts/${shiftId}`, { method: 'DELETE' });
      if (res.status === 'success') {
        await initData();
        renderStaff();
        updateDashboardCounters();
        return;
      }
    } catch (err) {
      console.error("API delete shift failed, using fallback", err);
    }
  }

  state.shifts = state.shifts.filter(s => s.id !== shiftId);
  saveDataLocalOnly();
  renderStaff();
  updateDashboardCounters();
};

// Conversational Chatbot engine
window.sendChatMsg = function(msgText) {
  const msgContainer = document.getElementById('chatbot-messages');
  
  // User bubble
  const userDiv = document.createElement('div');
  userDiv.className = 'chat-bubble user';
  userDiv.innerText = msgText;
  msgContainer.appendChild(userDiv);
  msgContainer.scrollTop = msgContainer.scrollHeight;

  // Bot thinking transition
  setTimeout(() => {
    let reply = "I am not sure how to answer that question. You can try typing 'check symptoms', 'book appointment', or 'emergency alert' to navigate panels.";
    
    // Command triggers
    const query = msgText.toLowerCase();
    
    if (query.includes('check symptoms') || query.includes('diagnos') || query.includes('disease')) {
      reply = "Sure! Opening our **AI Disease Risk Predictor** panel. You can select your profile, input vitals, and generate risk indexes.";
      switchView('ai-predictions');
      // Highlight navigation
      const links = document.querySelectorAll('.sidebar-nav .nav-link');
      links.forEach(l => {
        l.classList.remove('active');
        if (l.getAttribute('data-view') === 'ai-predictions') l.classList.add('active');
      });
    } else if (query.includes('book') || query.includes('appointment') || query.includes('schedule')) {
      reply = "Excellent. Switched your view to the **Appointment Scheduler**. Fill in the clinic specialist and select a slot.";
      switchView('appointments');
      const links = document.querySelectorAll('.sidebar-nav .nav-link');
      links.forEach(l => {
        l.classList.remove('active');
        if (l.getAttribute('data-view') === 'appointments') l.classList.add('active');
      });
    } else if (query.includes('emergency') || query.includes('critical') || query.includes('help')) {
      reply = "🚨 Opening the **Emergency Control Center**. You can trigger code alerts or monitor notifications logs.";
      switchView('emergency');
      const links = document.querySelectorAll('.sidebar-nav .nav-link');
      links.forEach(l => {
        l.classList.remove('active');
        if (l.getAttribute('data-view') === 'emergency') l.classList.add('active');
      });
    } else {
      // General keywords match
      for (const faq of initialChatbotFaqs) {
        if (faq.keywords.some(k => query.includes(k))) {
          reply = faq.response;
          break;
        }
      }
    }

    const botDiv = document.createElement('div');
    botDiv.className = 'chat-bubble bot';
    botDiv.innerHTML = reply;
    msgContainer.appendChild(botDiv);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }, 500);
};
