/**
 * app.js
 * Core logic controller for CareSync Hospital Management System.
 * Coordinates view switching, authentication sessions, forms validation,
 * dynamic select selectors, receipt templates, and Chart.js reports.
 */

// Global Chart references to prevent re-instantiation glitches
let charts = {};

// Selected doctor for scheduling calendar view
let selectedDoctorId = null;

// Track dynamic rows
let medicationRowId = 0;
let invoiceItemRowId = 0;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Authentication Session
    checkAuthSession();

    // 2. Start clock
    updateClock();
    setInterval(updateClock, 60000);

    // 3. Setup Nav Tabs Routing
    initNavigation();

    // 4. Setup Global Search & Filters
    initSearchAndFilters();

    // 5. Bind Form Submissions
    initFormSubmissions();

    // 6. Setup slot availability checkers
    initAppointmentSlotChecker();
});

/* ==========================================
   1. Authentication & Session Manager
   ========================================== */
function checkAuthSession() {
    const sessionStr = sessionStorage.getItem('hms_session');
    const loginScreen = document.getElementById('login-screen');
    const hmsApp = document.getElementById('hms-app');

    if (sessionStr) {
        // Active Session found
        const user = JSON.parse(sessionStr);
        
        // Hide login, show app
        if (loginScreen) loginScreen.classList.add('hidden');
        if (hmsApp) hmsApp.classList.remove('hidden');

        // Apply role class to body for admin-only CSS styling
        document.body.className = ''; // reset classes
        if (user.role === 'Doctor') {
            document.body.classList.add('role-doctor');
        } else {
            document.body.classList.add('role-admin');
        }

        // Populate header / sidebar user details
        const avatarEl = document.getElementById('current-user-avatar');
        const nameEl = document.getElementById('current-user-name');
        const roleEl = document.getElementById('current-user-role');
        
        if (avatarEl) avatarEl.src = user.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150';
        if (nameEl) nameEl.textContent = user.name;
        if (roleEl) roleEl.textContent = user.role === 'Doctor' ? `${user.specialty} (${user.department})` : 'System Administrator';

        // Load dashboard on login
        renderDashboard();
    } else {
        // No session
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (hmsApp) hmsApp.classList.add('hidden');
    }
}

// Global hook: Switch between Doctor and Admin role in sign-in tab
window.switchLoginRole = function(role) {
    document.getElementById('login-role').value = role;
    
    // Toggle active tab buttons styling
    const tabs = document.querySelectorAll('.auth-tab-btn');
    tabs.forEach(btn => {
        if (btn.textContent.includes(role)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update triggers text
    const triggerText = document.getElementById('register-trigger-text');
    const triggerLink = document.querySelector('[onclick="toggleAuthBox(\'signup\')"]');
    if (role === 'Doctor') {
        if (triggerText) triggerText.style.display = 'inline';
        if (triggerLink) triggerLink.style.display = 'inline';
    } else {
        if (triggerText) triggerText.style.display = 'none';
        if (triggerLink) triggerLink.style.display = 'none';
    }
};

// Global hook: Switch login box views (Sign In vs Sign Up for new doctors)
window.toggleAuthBox = function(boxType) {
    const signInBox = document.getElementById('auth-signin-box');
    const signUpBox = document.getElementById('auth-signup-box');

    if (boxType === 'signup') {
        if (signInBox) signInBox.classList.add('hidden');
        if (signUpBox) signUpBox.classList.remove('hidden');
    } else {
        if (signInBox) signInBox.classList.remove('hidden');
        if (signUpBox) signUpBox.classList.add('hidden');
    }
};

/* ==========================================
   2. Clock & Navigation
   ========================================== */
function updateClock() {
    const timeDisplay = document.getElementById('current-time');
    if (!timeDisplay) return;
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
    };
    timeDisplay.textContent = now.toLocaleDateString('en-US', options);
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active classes
            navItems.forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked tab
            item.classList.add('active');
            const tabId = item.getAttribute('data-tab');
            const targetPane = document.getElementById(tabId);
            if (targetPane) {
                targetPane.classList.add('active');
            }

            // Route-specific render hooks
            routeTo(tabId);
        });
    });
}

function routeTo(tabId) {
    // Refresh list views to grab fresh localStorage changes
    if (tabId === 'dashboard') {
        renderDashboard();
    } else if (tabId === 'patients') {
        renderPatientsTable();
    } else if (tabId === 'doctors') {
        renderDoctorsTable();
        refreshDoctorSchedule();
    } else if (tabId === 'appointments') {
        populateSelectDropdowns();
        renderAppointmentsTable();
    } else if (tabId === 'prescriptions') {
        populateSelectDropdowns();
        renderPrescriptionsTable();
    } else if (tabId === 'billing') {
        populateSelectDropdowns();
        renderBillingTable();
    }
}

/* ==========================================
   3. Select Option Helpers
   ========================================== */
function populateSelectDropdowns() {
    const patients = window.db.getPatients();
    const doctors = window.db.getDoctors();

    // 1. Appointment Form dropdowns
    const apptPatient = document.getElementById('appt-patient');
    const apptDoctor = document.getElementById('appt-doctor');
    if (apptPatient) {
        apptPatient.innerHTML = '<option value="">Select Registered Patient</option>' + 
            patients.map(p => `<option value="${p.id}">${p.name} (${p.id})</option>`).join('');
    }
    if (apptDoctor) {
        apptDoctor.innerHTML = '<option value="">Select Doctor</option>' + 
            doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty} (${d.department})</option>`).join('');
    }

    // 2. Appointment Section Filter dropdown
    const filterDoctor = document.getElementById('appointment-doctor-filter');
    if (filterDoctor) {
        filterDoctor.innerHTML = '<option value="">All Doctors</option>' + 
            doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    }

    // 3. Prescription Form dropdowns
    const prescPatient = document.getElementById('presc-patient');
    const prescDoctor = document.getElementById('presc-doctor');
    if (prescPatient) {
        prescPatient.innerHTML = '<option value="">Select Patient</option>' + 
            patients.map(p => `<option value="${p.id}">${p.name} (${p.id})</option>`).join('');
    }
    if (prescDoctor) {
        prescDoctor.innerHTML = '<option value="">Select Doctor</option>' + 
            doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    }

    // 4. Billing Form dropdowns
    const billPatient = document.getElementById('bill-patient');
    if (billPatient) {
        billPatient.innerHTML = '<option value="">Select Patient</option>' + 
            patients.map(p => `<option value="${p.id}">${p.name} (${p.id})</option>`).join('');
    }
}

/* ==========================================
   4. Search & Filter Listeners
   ========================================== */
function initSearchAndFilters() {
    // Patient filters
    document.getElementById('patient-search')?.addEventListener('input', renderPatientsTable);
    document.getElementById('patient-gender-filter')?.addEventListener('change', renderPatientsTable);

    // Doctor filters
    document.getElementById('doctor-search')?.addEventListener('input', renderDoctorsTable);

    // Appointment filters
    document.getElementById('appointment-search')?.addEventListener('input', renderAppointmentsTable);
    document.getElementById('appointment-doctor-filter')?.addEventListener('change', renderAppointmentsTable);
    document.getElementById('appointment-status-filter')?.addEventListener('change', renderAppointmentsTable);
    document.getElementById('appointment-date-filter')?.addEventListener('change', renderAppointmentsTable);

    // Prescription filters
    document.getElementById('prescription-search')?.addEventListener('input', renderPrescriptionsTable);

    // Billing filters
    document.getElementById('billing-search')?.addEventListener('input', renderBillingTable);
    document.getElementById('billing-status-filter')?.addEventListener('change', renderBillingTable);

    // Global Search Header logic (redirects to active tab with search query)
    document.getElementById('global-search')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const activeNav = document.querySelector('.nav-item.active');
        if (!activeNav) return;
        const currentTab = activeNav.getAttribute('data-tab');

        // Forward query to active section search box
        if (currentTab === 'patients') {
            const el = document.getElementById('patient-search');
            if (el) { el.value = query; renderPatientsTable(); }
        } else if (currentTab === 'doctors') {
            const el = document.getElementById('doctor-search');
            if (el) { el.value = query; renderDoctorsTable(); }
        } else if (currentTab === 'appointments') {
            const el = document.getElementById('appointment-search');
            if (el) { el.value = query; renderAppointmentsTable(); }
        } else if (currentTab === 'prescriptions') {
            const el = document.getElementById('prescription-search');
            if (el) { el.value = query; renderPrescriptionsTable(); }
        } else if (currentTab === 'billing') {
            const el = document.getElementById('billing-search');
            if (el) { el.value = query; renderBillingTable(); }
        }
    });
}

/* ==========================================
   5. Modals Handler
   ========================================== */
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        // Reset forms inside modal if closing
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
};

// Global modal close on outer click
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
        const form = e.target.querySelector('form');
        if (form) form.reset();
    }
});

/* ==========================================
   6. Patients Controller
   ========================================== */
function renderPatientsTable() {
    const tbody = document.querySelector('#patients-table tbody');
    if (!tbody) return;

    const searchQuery = document.getElementById('patient-search')?.value.toLowerCase() || '';
    const genderFilter = document.getElementById('patient-gender-filter')?.value || '';
    
    let patients = window.db.getPatients();

    // Filters
    if (searchQuery) {
        patients = patients.filter(p => 
            p.name.toLowerCase().includes(searchQuery) ||
            p.id.toLowerCase().includes(searchQuery) ||
            p.phone.includes(searchQuery)
        );
    }
    if (genderFilter) {
        patients = patients.filter(p => p.gender === genderFilter);
    }

    if (patients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="text-align:center; padding:30px; color:var(--gray-medium);">No patients found match filters.</td></tr>`;
        return;
    }

    tbody.innerHTML = patients.map(p => {
        // Calculate age
        const age = new Date().getFullYear() - new Date(p.dob).getFullYear();
        return `
            <tr>
                <td><strong>${p.id}</strong></td>
                <td>${p.name}</td>
                <td>${age} yrs <span style="font-size:11px; color:var(--gray-medium); display:block;">(${p.dob})</span></td>
                <td><span class="badge ${p.gender === 'Male' ? 'badge-info' : p.gender === 'Female' ? 'badge-success' : 'badge-warning'}">${p.gender}</span></td>
                <td>${p.phone}</td>
                <td><span style="font-size:12px;">${p.emergencyContact}</span></td>
                <td>${p.registrationDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" title="Book Appointment" onclick="shortcutBookAppointment('${p.id}')">
                            <i class="fa-solid fa-calendar-plus"></i>
                        </button>
                        <button class="btn-icon admin-only" title="Generate Invoice" onclick="shortcutCreateInvoice('${p.id}')">
                            <i class="fa-solid fa-file-invoice-dollar"></i>
                        </button>
                        <button class="btn-icon" title="Edit Patient" onclick="openEditPatient('${p.id}')">
                            <i class="fa-solid fa-user-pen"></i>
                        </button>
                        <button class="btn-icon delete" title="Delete Patient" onclick="deletePatient('${p.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.openEditPatient = function(id) {
    const patient = window.db.getPatient(id);
    if (!patient) return;

    document.getElementById('edit-patient-id').value = patient.id;
    document.getElementById('patient-name').value = patient.name;
    document.getElementById('patient-dob').value = patient.dob;
    document.getElementById('patient-gender').value = patient.gender;
    document.getElementById('patient-phone').value = patient.phone;
    document.getElementById('patient-email').value = patient.email || '';
    document.getElementById('patient-address').value = patient.address || '';
    document.getElementById('patient-emergency').value = patient.emergencyContact;

    document.getElementById('patient-modal-title').textContent = "Modify Patient Profile";
    window.openModal('patient-modal');
};

window.deletePatient = function(id) {
    if (confirm(`Are you sure you want to permanently delete patient ${id}? All related appointments and billing history will remain for records.`)) {
        window.db.deletePatient(id);
        renderPatientsTable();
        alert('Patient record deleted successfully.');
    }
};

window.shortcutBookAppointment = function(patientId) {
    populateSelectDropdowns();
    document.getElementById('appt-patient').value = patientId;
    // Switch to appointments tab visually
    const tabEl = document.querySelector('.nav-item[data-tab="appointments"]');
    if (tabEl) tabEl.click();
    window.openModal('appointment-modal');
};

window.shortcutCreateInvoice = function(patientId) {
    populateSelectDropdowns();
    document.getElementById('bill-patient').value = patientId;
    const tabEl = document.querySelector('.nav-item[data-tab="billing"]');
    if (tabEl) tabEl.click();
    window.openInvoiceModal();
};

/* ==========================================
   7. Doctors & Schedule Controller
   ========================================== */
function renderDoctorsTable() {
    const tbody = document.querySelector('#doctors-table tbody');
    if (!tbody) return;

    const searchQuery = document.getElementById('doctor-search')?.value.toLowerCase() || '';
    let doctors = window.db.getDoctors();

    if (searchQuery) {
        doctors = doctors.filter(d => 
            d.name.toLowerCase().includes(searchQuery) ||
            d.specialty.toLowerCase().includes(searchQuery) ||
            d.department.toLowerCase().includes(searchQuery)
        );
    }

    if (doctors.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--gray-medium);">No doctors registered.</td></tr>`;
        return;
    }

    tbody.innerHTML = doctors.map(d => `
        <tr class="doctor-row-click ${selectedDoctorId === d.id ? 'table-active' : ''}" style="cursor:pointer;" onclick="selectDoctor('${d.id}')">
            <td><strong>${d.id}</strong></td>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <i class="fa-solid fa-stethoscope" style="color:var(--primary);"></i>
                    <strong>${d.name}</strong>
                </div>
            </td>
            <td><span class="badge badge-info">${d.specialty}</span></td>
            <td>${d.department}</td>
            <td>
                <div style="font-size:12px;">
                    <i class="fa-solid fa-envelope"></i> ${d.email}<br>
                    <i class="fa-solid fa-phone"></i> ${d.phone}
                </div>
            </td>
            <td class="admin-only">
                <div class="action-buttons" onclick="event.stopPropagation();">
                    <button class="btn-icon delete" title="Remove Profile" onclick="deleteDoctor('${d.id}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.selectDoctor = function(id) {
    selectedDoctorId = id;
    renderDoctorsTable(); // Re-render to show active highlighted row
    refreshDoctorSchedule();
};

function refreshDoctorSchedule() {
    const scheduleCard = document.getElementById('schedule-calendar-view');
    const emptyState = document.getElementById('schedule-empty-state');
    const doctorNameHeader = document.getElementById('schedule-doctor-name');

    if (!selectedDoctorId) {
        scheduleCard.classList.add('hidden');
        emptyState.classList.remove('hidden');
        doctorNameHeader.textContent = "Select a Doctor";
        return;
    }

    const doctor = window.db.getDoctor(selectedDoctorId);
    if (!doctor) {
        selectedDoctorId = null;
        refreshDoctorSchedule();
        return;
    }

    emptyState.classList.add('hidden');
    scheduleCard.classList.remove('hidden');
    doctorNameHeader.textContent = `${doctor.name} - Schedule`;

    // Render calendar rows
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    scheduleCard.innerHTML = days.map(day => {
        const slots = doctor.availability[day] || [];
        return `
            <div class="calendar-day-row">
                <span class="calendar-day-name">${day}</span>
                <div class="calendar-slots">
                    ${slots.length > 0 
                        ? slots.map(slot => `<span class="time-slot-pill">${slot}</span>`).join('') 
                        : `<span style="font-size:11px; color:var(--gray-medium); font-style:italic;">No shifts scheduled</span>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

window.deleteDoctor = function(id) {
    if (confirm(`Remove physician ${id} from staff list? Active schedules will be deleted.`)) {
        window.db.deleteDoctor(id);
        if (selectedDoctorId === id) selectedDoctorId = null;
        renderDoctorsTable();
        refreshDoctorSchedule();
        alert('Physician profile removed.');
    }
};

/* ==========================================
   8. Appointments Scheduler Controller
   ========================================== */
function renderAppointmentsTable() {
    const tbody = document.querySelector('#appointments-table tbody');
    if (!tbody) return;

    const searchQuery = document.getElementById('appointment-search')?.value.toLowerCase() || '';
    const doctorFilter = document.getElementById('appointment-doctor-filter')?.value || '';
    const statusFilter = document.getElementById('appointment-status-filter')?.value || '';
    const dateFilter = document.getElementById('appointment-date-filter')?.value || '';

    let appointments = window.db.getAppointments();
    const dbPatients = window.db.getPatients();
    const dbDoctors = window.db.getDoctors();

    // Filters
    if (searchQuery) {
        appointments = appointments.filter(a => {
            const patient = dbPatients.find(p => p.id === a.patientId);
            return (patient && patient.name.toLowerCase().includes(searchQuery)) || 
                   a.reason.toLowerCase().includes(searchQuery) ||
                   a.id.toLowerCase().includes(searchQuery);
        });
    }
    if (doctorFilter) {
        appointments = appointments.filter(a => a.doctorId === doctorFilter);
    }
    if (statusFilter) {
        appointments = appointments.filter(a => a.status === statusFilter);
    }
    if (dateFilter) {
        appointments = appointments.filter(a => a.date === dateFilter);
    }

    if (appointments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--gray-medium);">No appointments match your filters.</td></tr>`;
        return;
    }

    // Sort by date/time (simplistic sort)
    appointments.sort((a, b) => b.date.localeCompare(a.date));

    tbody.innerHTML = appointments.map(a => {
        const patient = dbPatients.find(p => p.id === a.patientId) || { name: 'Unknown Patient' };
        const doctor = dbDoctors.find(d => d.id === a.doctorId) || { name: 'Unknown Doctor' };
        
        let statusBadgeClass = 'badge-warning';
        if (a.status === 'Completed') statusBadgeClass = 'badge-success';
        if (a.status === 'Cancelled') statusBadgeClass = 'badge-danger';

        let showActions = a.status === 'Scheduled';

        return `
            <tr>
                <td><strong>${a.id}</strong></td>
                <td>${patient.name} <span style="font-size:11px; color:var(--gray-medium); display:block;">${a.patientId}</span></td>
                <td>${doctor.name} <span style="font-size:11px; color:var(--gray-medium); display:block;">${doctor.specialty}</span></td>
                <td><strong>${a.date}</strong></td>
                <td><span class="badge badge-info">${a.timeSlot}</span></td>
                <td><span style="font-size:13px; color:var(--gray-dark);">${a.reason}</span></td>
                <td><span class="badge ${statusBadgeClass}">${a.status}</span></td>
                <td>
                    <div class="action-buttons">
                        ${showActions ? `
                            <button class="btn btn-success btn-sm" onclick="completeAppointment('${a.id}')" title="Complete Appointment">
                                <i class="fa-solid fa-check"></i> Complete
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="cancelAppointment('${a.id}')" title="Cancel Appointment">
                                <i class="fa-solid fa-ban"></i> Cancel
                            </button>
                        ` : ''}
                        
                        ${a.status === 'Completed' ? `
                            <button class="btn btn-primary btn-sm" onclick="shortcutPrescribe('${a.id}')" title="Issue Prescription">
                                <i class="fa-solid fa-file-medical"></i> Prescribe
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.openAppointmentModal = function() {
    populateSelectDropdowns();
    // Reset date & slot fields
    document.getElementById('appt-date').value = '';
    const slotSelect = document.getElementById('appt-slot');
    slotSelect.innerHTML = '<option value="">Choose doctor & date first</option>';
    slotSelect.disabled = true;
    
    window.openModal('appointment-modal');
};

function initAppointmentSlotChecker() {
    const doctorSelect = document.getElementById('appt-doctor');
    const dateInput = document.getElementById('appt-date');
    const slotSelect = document.getElementById('appt-slot');

    if (!doctorSelect || !dateInput || !slotSelect) return;

    const checkSlots = () => {
        const doctorId = doctorSelect.value;
        const dateStr = dateInput.value;

        if (!doctorId || !dateStr) {
            slotSelect.innerHTML = '<option value="">Choose doctor & date first</option>';
            slotSelect.disabled = true;
            return;
        }

        const doctor = window.db.getDoctor(doctorId);
        if (!doctor) return;

        // Determine weekday from date input
        const dateObj = new Date(dateStr + 'T00:00:00'); // Prevent UTC conversion offsets
        const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

        const doctorDaySlots = doctor.availability[weekday] || [];

        if (doctorDaySlots.length === 0) {
            slotSelect.innerHTML = `<option value="">Dr. has no schedule on ${weekday}s</option>`;
            slotSelect.disabled = true;
            return;
        }

        // Filter out already booked slots
        const availableSlots = doctorDaySlots.map(slot => {
            const isFree = window.db.isSlotAvailable(doctorId, dateStr, slot);
            return {
                time: slot,
                isFree: isFree
            };
        });

        const freeSlots = availableSlots.filter(s => s.isFree);

        if (freeSlots.length === 0) {
            slotSelect.innerHTML = '<option value="">All slots booked for this day</option>';
            slotSelect.disabled = true;
        } else {
            slotSelect.innerHTML = '<option value="">Select Available Slot</option>' + 
                freeSlots.map(s => `<option value="${s.time}">${s.time}</option>`).join('');
            slotSelect.disabled = false;
        }
    };

    doctorSelect.addEventListener('change', checkSlots);
    dateInput.addEventListener('change', checkSlots);
}

window.completeAppointment = function(id) {
    if (confirm('Mark this appointment as Completed?')) {
        window.db.updateAppointmentStatus(id, 'Completed');
        renderAppointmentsTable();
        alert('Appointment status updated. You can now issue a prescription.');
    }
};

window.cancelAppointment = function(id) {
    if (confirm('Cancel this appointment? This slot will become available for booking immediately.')) {
        window.db.updateAppointmentStatus(id, 'Cancelled');
        
        // Also cancel/void the unpaid bill generated by this appointment
        const bills = window.db.getBills();
        const bill = bills.find(b => b.appointmentId === id && b.status === 'Unpaid');
        if (bill) {
            bill.items.push({ description: 'Appointment Cancelled - Invoice Voided', amount: -bill.total });
            bill.total = 0;
            bill.tax = 0;
            bill.grandTotal = 0;
            bill.status = 'Paid'; // Mask it as closed
            window.db.updateBill(bill);
        }
        
        renderAppointmentsTable();
        alert('Appointment cancelled.');
    }
};

window.shortcutPrescribe = function(appointmentId) {
    const appt = window.db.getAppointment(appointmentId);
    if (!appt) return;

    populateSelectDropdowns();
    
    // Switch view
    const tabEl = document.querySelector('.nav-item[data-tab="prescriptions"]');
    if (tabEl) tabEl.click();

    window.openPrescriptionModal();
    
    // Pre-populate fields
    document.getElementById('presc-patient').value = appt.patientId;
    document.getElementById('presc-doctor').value = appt.doctorId;
    
    // Cache the appointment link on the form so we know how to connect it
    document.getElementById('prescription-form').setAttribute('data-appt-id', appointmentId);
};

/* ==========================================
   9. Prescriptions Controller
   ========================================== */
function renderPrescriptionsTable() {
    const tbody = document.querySelector('#prescriptions-table tbody');
    if (!tbody) return;

    const searchQuery = document.getElementById('prescription-search')?.value.toLowerCase() || '';
    let prescriptions = window.db.getPrescriptions();
    const dbPatients = window.db.getPatients();
    const dbDoctors = window.db.getDoctors();

    if (searchQuery) {
        prescriptions = prescriptions.filter(pr => {
            const patient = dbPatients.find(p => p.id === pr.patientId);
            const doctor = dbDoctors.find(d => d.id === pr.doctorId);
            return (patient && patient.name.toLowerCase().includes(searchQuery)) ||
                   (doctor && doctor.name.toLowerCase().includes(searchQuery)) ||
                   pr.diagnosis.toLowerCase().includes(searchQuery) ||
                   pr.id.toLowerCase().includes(searchQuery);
        });
    }

    if (prescriptions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--gray-medium);">No prescriptions records found.</td></tr>`;
        return;
    }

    // Sort newest first
    prescriptions.sort((a, b) => b.date.localeCompare(a.date));

    tbody.innerHTML = prescriptions.map(pr => {
        const patient = dbPatients.find(p => p.id === pr.patientId) || { name: 'Unknown' };
        const doctor = dbDoctors.find(d => d.id === pr.doctorId) || { name: 'Unknown' };
        const medsSummary = pr.medicines.map(m => m.name).join(', ');

        return `
            <tr>
                <td><strong>${pr.id}</strong></td>
                <td><strong>${patient.name}</strong> <span style="font-size:11px; color:var(--gray-medium); display:block;">${pr.patientId}</span></td>
                <td>${doctor.name}</td>
                <td>${pr.date}</td>
                <td><span style="font-size:13px; font-weight:600; color:var(--gray-dark);">${pr.diagnosis}</span></td>
                <td>
                    <span style="font-size:12px; color:var(--gray-dark); display:block; max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${medsSummary}">
                        ${medsSummary}
                    </span>
                    <small class="badge badge-info" style="margin-top:4px;">${pr.medicines.length} items</small>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-secondary btn-sm" onclick="printPrescription('${pr.id}')">
                            <i class="fa-solid fa-print"></i> Print / View
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.openPrescriptionModal = function() {
    populateSelectDropdowns();
    document.getElementById('medication-rows').innerHTML = '';
    medicationRowId = 0;
    // Set active placeholder row
    window.addMedicationRow();
    
    // Clear custom attributes
    document.getElementById('prescription-form').removeAttribute('data-appt-id');
    window.openModal('prescription-modal');
};

window.addMedicationRow = function() {
    const container = document.getElementById('medication-rows');
    if (!container) return;

    medicationRowId++;
    const row = document.createElement('div');
    row.className = 'medication-row';
    row.id = `med-row-${medicationRowId}`;
    row.innerHTML = `
        <input type="text" placeholder="Drug Name" required class="med-name">
        <input type="text" placeholder="e.g. 500mg" required class="med-dosage">
        <input type="text" placeholder="e.g. Twice Daily" required class="med-frequency">
        <input type="text" placeholder="e.g. 10 Days" required class="med-duration">
        <button type="button" class="remove-row-btn" onclick="removeMedicationRow(${medicationRowId})" title="Remove Medication">
            <i class="fa-solid fa-circle-minus"></i>
        </button>
    `;
    container.appendChild(row);
};

window.removeMedicationRow = function(rowNum) {
    // Prevent removing if only 1 row remains
    const rows = document.querySelectorAll('.medication-row');
    if (rows.length <= 1) {
        alert('Prescriptions must contain at least one medication record.');
        return;
    }
    const row = document.getElementById(`med-row-${rowNum}`);
    if (row) row.remove();
};

window.printPrescription = function(id) {
    const pr = window.db.getPrescription(id);
    if (!pr) return;

    const patient = window.db.getPatient(pr.patientId) || {};
    const doctor = window.db.getDoctor(pr.doctorId) || {};

    const age = patient.dob ? (new Date().getFullYear() - new Date(patient.dob).getFullYear()) : 'N/A';

    const modalBody = document.getElementById('print-document-body');
    modalBody.innerHTML = `
        <div class="doc-shell">
            <!-- Hospital Header -->
            <div class="doc-header">
                <div>
                    <div class="doc-logo-title">
                        <i class="fa-solid fa-heart-pulse"></i>
                        <span>CareSync Hospital</span>
                    </div>
                    <div class="doc-type-title">Medical Prescription</div>
                </div>
                <div class="hospital-details">
                    CareSync Medical Plaza, 5th Avenue<br>
                    Springfield, IL - Ph: +1 (555) 999-0100<br>
                    support@caresync.com
                </div>
            </div>

            <!-- Meta info grid -->
            <div class="doc-meta-grid">
                <div class="doc-meta-col">
                    <span>Patient Name: <strong>${patient.name || 'Unknown'}</strong></span>
                    <span>Patient ID: <strong>${patient.id}</strong></span>
                    <span>Age / Gender: <strong>${age} years / ${patient.gender || 'N/A'}</strong></span>
                </div>
                <div class="doc-meta-col">
                    <span>Date Issued: <strong>${pr.date}</strong></span>
                    <span>Prescription ID: <strong>${pr.id}</strong></span>
                    <span>Doctor: <strong>${doctor.name || 'Staff Practitioner'}</strong></span>
                </div>
            </div>

            <!-- Diagnosis section -->
            <div class="doc-content-section">
                <div class="doc-section-title">Clinical Diagnosis Summary</div>
                <p style="font-size: 14px; font-weight: 600; color: #334155; margin-left: 10px;">${pr.diagnosis}</p>
            </div>

            <!-- Rx Medications list -->
            <div class="doc-content-section">
                <div class="doc-section-title">Rx (Medications Prescribed)</div>
                <div class="rx-symbol">℞</div>
                <table class="prescription-med-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Medication / Formula Name</th>
                            <th>Dosage Strength</th>
                            <th>Directions & Frequency</th>
                            <th>Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pr.medicines.map((m, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td><strong>${m.name}</strong></td>
                                <td>${m.dosage}</td>
                                <td>${m.frequency}</td>
                                <td>${m.duration}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Non pharmacological notes advice -->
            ${pr.notes ? `
                <div class="doc-content-section">
                    <div class="doc-section-title">Special Instructions & Advice</div>
                    <div class="doc-notes-block">${pr.notes}</div>
                </div>
            ` : ''}

            <!-- Bottom signatures -->
            <div class="doc-footer-signature">
                <div class="signature-line">Patient Signature</div>
                <div class="signature-line" style="border-top: none;">
                    <div style="border-top: 1px solid #cbd5e1; width: 200px; padding-top: 6px;">
                        ${doctor.name || 'Practitioner'}<br>
                        <span style="font-size: 9px; color:#94a3b8;">Registered ID License</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    window.openModal('print-modal');
};

/* ==========================================
   10. Billing Controller
   ========================================== */
function renderBillingTable() {
    const tbody = document.querySelector('#billing-table tbody');
    if (!tbody) return;

    const searchQuery = document.getElementById('billing-search')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('billing-status-filter')?.value || '';

    let bills = window.db.getBills();
    const dbPatients = window.db.getPatients();

    if (searchQuery) {
        bills = bills.filter(b => {
            const patient = dbPatients.find(p => p.id === b.patientId);
            return (patient && patient.name.toLowerCase().includes(searchQuery)) ||
                   b.id.toLowerCase().includes(searchQuery);
        });
    }
    if (statusFilter) {
        bills = bills.filter(b => b.status === statusFilter);
    }

    if (bills.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--gray-medium);">No billing invoices match.</td></tr>`;
        return;
    }

    // Sort newest bills first
    bills.sort((a, b) => b.date.localeCompare(a.date));

    tbody.innerHTML = bills.map(b => {
        const patient = dbPatients.find(p => p.id === b.patientId) || { name: 'Unknown' };
        
        let statusBadgeClass = b.status === 'Paid' ? 'badge-success' : 'badge-danger';
        
        return `
            <tr>
                <td><strong>${b.id}</strong></td>
                <td><strong>${patient.name}</strong> <span style="font-size:11px; color:var(--gray-medium); display:block;">${b.patientId}</span></td>
                <td>${b.date}</td>
                <td>$${b.total.toFixed(2)}</td>
                <td>$${b.tax.toFixed(2)}</td>
                <td class="text-danger">-$${b.discount.toFixed(2)}</td>
                <td><strong>$${b.grandTotal.toFixed(2)}</strong></td>
                <td>
                    <span class="badge ${statusBadgeClass}">
                        ${b.status} ${b.paymentMethod ? `(${b.paymentMethod})` : ''}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        ${b.status === 'Unpaid' ? `
                            <button class="btn btn-success btn-sm" onclick="openPaymentModal('${b.id}')">
                                <i class="fa-solid fa-money-bill-wave"></i> Pay
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary btn-sm" onclick="printInvoice('${b.id}')">
                            <i class="fa-solid fa-file-pdf"></i> View Invoice
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.openInvoiceModal = function() {
    populateSelectDropdowns();
    document.getElementById('bill-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('bill-discount').value = "0.00";
    
    // Clear items builder
    document.getElementById('invoice-item-rows').innerHTML = '';
    invoiceItemRowId = 0;
    window.addInvoiceItemRow(); // start with one blank item
    
    window.openModal('invoice-modal');
};

window.addInvoiceItemRow = function() {
    const container = document.getElementById('invoice-item-rows');
    if (!container) return;

    invoiceItemRowId++;
    const row = document.createElement('div');
    row.className = 'invoice-item-row';
    row.id = `bill-item-row-${invoiceItemRowId}`;
    row.innerHTML = `
        <input type="text" placeholder="Service description / medical supply" required class="bill-item-desc">
        <input type="number" placeholder="Cost ($)" min="0" step="0.01" required class="bill-item-cost" oninput="window.calculateInvoiceTotals()">
        <button type="button" class="remove-row-btn" onclick="removeInvoiceItemRow(${invoiceItemRowId})" title="Remove Item">
            <i class="fa-solid fa-circle-minus"></i>
        </button>
    `;
    container.appendChild(row);
    window.calculateInvoiceTotals();
};

window.removeInvoiceItemRow = function(rowNum) {
    const rows = document.querySelectorAll('.invoice-item-row');
    if (rows.length <= 1) {
        alert('Invoices must charge for at least one service item.');
        return;
    }
    const row = document.getElementById(`bill-item-row-${rowNum}`);
    if (row) row.remove();
    window.calculateInvoiceTotals();
};

window.calculateInvoiceTotals = function() {
    const costs = Array.from(document.querySelectorAll('.bill-item-cost')).map(input => parseFloat(input.value) || 0);
    const subtotal = costs.reduce((sum, val) => sum + val, 0);
    
    const discount = parseFloat(document.getElementById('bill-discount').value) || 0;
    const tax = subtotal * 0.05; // 5% tax
    const total = Math.max(0, subtotal + tax - discount);

    document.getElementById('bill-calc-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('bill-calc-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('bill-calc-total').textContent = `$${total.toFixed(2)}`;
};

// Bind live discount recalculator
document.getElementById('bill-discount')?.addEventListener('input', window.calculateInvoiceTotals);

window.openPaymentModal = function(invoiceId) {
    const bill = window.db.getBill(invoiceId);
    if (!bill) return;

    document.getElementById('pay-invoice-id').value = bill.id;
    document.getElementById('pay-invoice-display-id').textContent = bill.id;
    document.getElementById('pay-invoice-amount').textContent = `$${bill.grandTotal.toFixed(2)}`;
    
    window.openModal('payment-modal');
};

window.printInvoice = function(id) {
    const bill = window.db.getBill(id);
    if (!bill) return;

    const patient = window.db.getPatient(bill.patientId) || {};
    const age = patient.dob ? (new Date().getFullYear() - new Date(patient.dob).getFullYear()) : 'N/A';

    const modalBody = document.getElementById('print-document-body');
    modalBody.innerHTML = `
        <div class="doc-shell">
            <!-- Hospital Header -->
            <div class="doc-header">
                <div>
                    <div class="doc-logo-title">
                        <i class="fa-solid fa-heart-pulse"></i>
                        <span>CareSync Hospital</span>
                    </div>
                    <div class="doc-type-title">Billing Invoice</div>
                </div>
                <div class="hospital-details">
                    CareSync Medical Plaza, 5th Avenue<br>
                    Springfield, IL - Ph: +1 (555) 999-0100<br>
                    billing@caresync.com
                </div>
            </div>

            <!-- Meta info grid -->
            <div class="doc-meta-grid">
                <div class="doc-meta-col">
                    <span>Bill To: <strong>${patient.name || 'Unknown Patient'}</strong></span>
                    <span>Patient ID: <strong>${patient.id}</strong></span>
                    <span>Address: <strong>${patient.address || 'Not Provided'}</strong></span>
                </div>
                <div class="doc-meta-col">
                    <span>Date Invoiced: <strong>${bill.date}</strong></span>
                    <span>Invoice Number: <strong>${bill.id}</strong></span>
                    <span>Payment Status: <strong style="color:${bill.status === 'Paid' ? 'green' : 'red'}; text-transform:uppercase;">${bill.status}</strong></span>
                </div>
            </div>

            <!-- Line Items table -->
            <div class="doc-content-section">
                <div class="doc-section-title">Summary of Charged Services</div>
                <table class="doc-billing-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Description of Medical Service / Supply</th>
                            <th style="text-align: right;">Unit Price ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bill.items.map((item, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td>${item.description}</td>
                                <td style="text-align: right;">$${item.amount.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Calculation grid -->
            <div class="doc-billing-math">
                <div>
                    <span>Subtotal:</span>
                    <span>$${(bill.total).toFixed(2)}</span>
                </div>
                <div>
                    <span>Tax (5% GST/HST):</span>
                    <span>$${(bill.tax).toFixed(2)}</span>
                </div>
                ${bill.discount > 0 ? `
                    <div style="color:red;">
                        <span>Applied Discount:</span>
                        <span>-$${(bill.discount).toFixed(2)}</span>
                    </div>
                ` : ''}
                <div class="doc-grand-total">
                    <span>Total Amount:</span>
                    <span>$${bill.grandTotal.toFixed(2)}</span>
                </div>
            </div>

            <!-- Payment metadata signature -->
            <div class="doc-content-section" style="margin-top: 30px;">
                <p style="font-size: 11px; color:#64748b;">
                    * All payments are due within 30 days of the invoice issuance. Thank you for choosing CareSync for your healthcare needs.<br>
                    ${bill.status === 'Paid' ? `Payment received via <strong>${bill.paymentMethod}</strong>. Receipts sent to Registered Email: ${patient.email || 'N/A'}.` : 'Please pay at the hospital cashier desk or through your insurance provider portal.'}
                </p>
            </div>

            <!-- Bottom signatures -->
            <div class="doc-footer-signature">
                <div class="signature-line">Authorized Hospital Signature</div>
                <div class="signature-line">Receiver Signature</div>
            </div>
        </div>
    `;

    window.openModal('print-modal');
};

/* ==========================================
   11. Dashboard & Chart Rendering Engine (Reports)
   ========================================== */
function renderDashboard() {
    const patients = window.db.getPatients();
    const doctors = window.db.getDoctors();
    const appointments = window.db.getAppointments();
    const bills = window.db.getBills();

    // 1. Compute KPIs
    const totalPatientsCount = patients.length;
    const activeDoctorsCount = doctors.length;
    
    // Appointments today (defined relative to system date 2026-06-21)
    const todayStr = '2026-06-21';
    const todayAppointmentsCount = appointments.filter(a => a.date === todayStr && a.status !== 'Cancelled').length;

    // Total Revenue (accumulated paid invoices)
    const totalRevenueSum = bills
        .filter(b => b.status === 'Paid')
        .reduce((sum, b) => sum + b.grandTotal, 0);

    // Apply values to UI
    document.getElementById('stat-total-patients').textContent = totalPatientsCount;
    document.getElementById('stat-active-doctors').textContent = activeDoctorsCount;
    document.getElementById('stat-today-appointments').textContent = todayAppointmentsCount;
    document.getElementById('stat-total-revenue').textContent = `$${totalRevenueSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // 2. Setup Charts (Chart.js library renders)
    renderCharts(patients, doctors, appointments, bills);
}

function renderCharts(patients, doctors, appointments, bills) {
    // Clean up old charts first to prevent canvas redraw issues
    Object.keys(charts).forEach(key => {
        if (charts[key]) {
            charts[key].destroy();
        }
    });

    // ----------------------------------------------------
    // CHART 1: Monthly Revenue Trend (Last 6 Months)
    // ----------------------------------------------------
    const months = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'];
    const revenueByMonth = {
        '2026-01': 0, '2026-02': 0, '2026-03': 0,
        '2026-04': 0, '2026-05': 284.50, '2026-06': 542.50
    };

    // Calculate actual revenue from database
    bills.forEach(b => {
        if (b.status === 'Paid') {
            const yyyymm = b.date.substring(0, 7); // 'YYYY-MM'
            if (revenueByMonth[yyyymm] !== undefined) {
                revenueByMonth[yyyymm] += b.grandTotal;
            } else {
                revenueByMonth[yyyymm] = b.grandTotal;
            }
        }
    });

    const revenueData = [
        1200.00, // Jan (seeded baseline)
        1450.00, // Feb
        1380.00, // Mar
        1650.00, // Apr
        1500.00 + (revenueByMonth['2026-05'] || 0), // May
        (revenueByMonth['2026-06'] || 0) // Jun (actuals from db)
    ];

    const ctxRevenue = document.getElementById('chart-revenue')?.getContext('2d');
    if (ctxRevenue) {
        charts.revenue = new Chart(ctxRevenue, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Revenue ($)',
                    data: revenueData,
                    borderColor: '#0284c7',
                    backgroundColor: 'rgba(2, 132, 199, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#0369a1',
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' },
                        ticks: { callback: value => '$' + value }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // ----------------------------------------------------
    // CHART 2: Appointments / Patients by Department
    // ----------------------------------------------------
    const departments = ['Cardiology', 'Pediatrics', 'Orthopedics', 'Neurology', 'General Medicine'];
    const departmentCounts = {
        'Cardiology': 0, 'Pediatrics': 0, 'Orthopedics': 0, 'Neurology': 0, 'General Medicine': 0
    };

    appointments.forEach(a => {
        const doc = doctors.find(d => d.id === a.doctorId);
        if (doc && departmentCounts[doc.department] !== undefined) {
            departmentCounts[doc.department]++;
        }
    });

    const ctxDepts = document.getElementById('chart-departments')?.getContext('2d');
    if (ctxDepts) {
        charts.departments = new Chart(ctxDepts, {
            type: 'bar',
            data: {
                labels: departments,
                datasets: [{
                    data: departments.map(d => departmentCounts[d]),
                    backgroundColor: [
                        '#0284c7', // Cardiology
                        '#0d9488', // Pediatrics
                        '#ca8a04', // Orthopedics
                        '#8b5cf6', // Neurology
                        '#10b981'  // General Medicine
                    ],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: '#f1f5f9' }, 
                        ticks: { stepSize: 1 } 
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // ----------------------------------------------------
    // CHART 3: Appointment Status Distribution
    // ----------------------------------------------------
    const statuses = ['Scheduled', 'Completed', 'Cancelled'];
    const statusCounts = { 'Scheduled': 0, 'Completed': 0, 'Cancelled': 0 };

    appointments.forEach(a => {
        if (statusCounts[a.status] !== undefined) {
            statusCounts[a.status]++;
        }
    });

    const ctxAppts = document.getElementById('chart-appointments')?.getContext('2d');
    if (ctxAppts) {
        charts.appointments = new Chart(ctxAppts, {
            type: 'doughnut',
            data: {
                labels: statuses,
                datasets: [{
                    data: statuses.map(s => statusCounts[s]),
                    backgroundColor: [
                        '#ca8a04', // Scheduled (Warning Amber)
                        '#16a34a', // Completed (Success Green)
                        '#dc2626'  // Cancelled (Danger Red)
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { family: 'inherit', size: 11 } }
                    }
                },
                cutout: '65%'
            }
        });
    }
}

/* ==========================================
   12. Form Submissions Logic
   ========================================== */
function initFormSubmissions() {
    // 1. Authentication Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value;

            const user = window.db.authenticateUser(email, pass);
            
            if (user) {
                sessionStorage.setItem('hms_session', JSON.stringify(user));
                checkAuthSession();
                
                // Clear form
                loginForm.reset();
            } else {
                alert('Authentication Failed: Invalid email credentials or password.');
            }
        });
    }

    // 2. Doctor Registration (Signup Screen for credentials)
    const docSignupForm = document.getElementById('doctor-signup-form');
    if (docSignupForm) {
        docSignupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('signup-name').value.trim();
            const spec = document.getElementById('signup-specialty').value.trim();
            const dept = document.getElementById('signup-dept').value;
            const email = document.getElementById('signup-email').value.trim();
            const phone = document.getElementById('signup-phone').value.trim();
            const pass = document.getElementById('signup-password').value;
            const confirmPass = document.getElementById('signup-confirm-password').value;

            if (pass.length < 6) {
                alert('Security Error: Password must be at least 6 characters.');
                return;
            }

            if (pass !== confirmPass) {
                alert('Validation Error: Passwords do not match.');
                return;
            }

            // Check if email already registered
            const doctors = window.db.getDoctors();
            if (doctors.some(d => d.email.toLowerCase() === email.toLowerCase())) {
                alert('Registration Conflict: This email is already registered to a staff profile.');
                return;
            }

            const newDoc = {
                name,
                specialty: spec,
                department: dept,
                email,
                phone,
                password: pass
            };

            const added = window.db.addDoctor(newDoc);
            
            // Auto log-in new doctor
            const sessionUser = {
                id: added.id,
                name: added.name,
                email: added.email,
                specialty: added.specialty,
                department: added.department,
                role: 'Doctor',
                avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150'
            };

            sessionStorage.setItem('hms_session', JSON.stringify(sessionUser));
            
            alert(`Registration successful! Welcome Dr. ${name}. Staff ID: ${added.id}`);
            docSignupForm.reset();
            
            // Switch view back to signin overlay default state then trigger reload session
            window.toggleAuthBox('signin');
            checkAuthSession();
        });
    }

    // 3. Logout trigger
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to sign out of CareSync clinical portal?')) {
                sessionStorage.removeItem('hms_session');
                checkAuthSession();
                
                // Return navigation to default dashboard tab
                const navItems = document.querySelectorAll('.nav-item');
                navItems.forEach(nav => nav.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                
                const dashTab = document.querySelector('.nav-item[data-tab="dashboard"]');
                const dashPane = document.getElementById('dashboard');
                if (dashTab) dashTab.classList.add('active');
                if (dashPane) dashPane.classList.add('active');
            }
        });
    }

    // 4. Patient registration form
    const patientForm = document.getElementById('patient-form');
    if (patientForm) {
        patientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const editId = document.getElementById('edit-patient-id').value;
            const newPatient = {
                name: document.getElementById('patient-name').value.trim(),
                dob: document.getElementById('patient-dob').value,
                gender: document.getElementById('patient-gender').value,
                phone: document.getElementById('patient-phone').value.trim(),
                email: document.getElementById('patient-email').value.trim(),
                address: document.getElementById('patient-address').value.trim(),
                emergencyContact: document.getElementById('patient-emergency').value.trim()
            };

            // Custom validity checker (e.g. DOB must be in the past)
            if (new Date(newPatient.dob) > new Date()) {
                alert('Invalid Birthdate. Patient date of birth must be in the past.');
                return;
            }

            if (editId) {
                newPatient.id = editId;
                window.db.updatePatient(newPatient);
                alert(`Patient ${editId} profile updated successfully.`);
            } else {
                const added = window.db.addPatient(newPatient);
                alert(`New patient registered successfully with ID: ${added.id}`);
            }

            window.closeModal('patient-modal');
            renderPatientsTable();
        });
    }

    // 5. Doctor registration form (Admin Portal panel addition)
    const doctorForm = document.getElementById('doctor-form');
    if (doctorForm) {
        doctorForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newDoctor = {
                name: document.getElementById('doctor-name').value.trim(),
                specialty: document.getElementById('doctor-specialty').value.trim(),
                department: document.getElementById('doctor-dept').value,
                email: document.getElementById('doctor-email').value.trim(),
                phone: document.getElementById('doctor-phone').value.trim(),
                password: document.getElementById('doctor-password').value || 'password123'
            };

            const added = window.db.addDoctor(newDoctor);
            alert(`Doctor registration successful. Staff ID: ${added.id}`);
            window.closeModal('doctor-modal');
            renderDoctorsTable();
        });
    }

    // 6. Appointment form
    const appointmentForm = document.getElementById('appointment-form');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const appt = {
                patientId: document.getElementById('appt-patient').value,
                doctorId: document.getElementById('appt-doctor').value,
                date: document.getElementById('appt-date').value,
                timeSlot: document.getElementById('appt-slot').value,
                reason: document.getElementById('appt-reason').value.trim(),
                status: 'Scheduled'
            };

            // Double check slot availability
            if (!window.db.isSlotAvailable(appt.doctorId, appt.date, appt.timeSlot)) {
                alert('Double-booking Alert: This doctor slot has just been reserved. Please select another slot.');
                return;
            }

            const booked = window.db.addAppointment(appt);
            alert(`Appointment Scheduled! Reservation ID: ${booked.id}. A pending billing invoice has been generated.`);
            window.closeModal('appointment-modal');
            renderAppointmentsTable();
        });
    }

    // 7. Prescription form
    const prescriptionForm = document.getElementById('prescription-form');
    if (prescriptionForm) {
        prescriptionForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const presc = {
                patientId: document.getElementById('presc-patient').value,
                doctorId: document.getElementById('presc-doctor').value,
                diagnosis: document.getElementById('presc-diagnosis').value.trim(),
                notes: document.getElementById('presc-notes').value.trim(),
                medicines: []
            };

            // Read medicines
            const rows = document.querySelectorAll('.medication-row');
            rows.forEach(row => {
                const name = row.querySelector('.med-name').value.trim();
                const dosage = row.querySelector('.med-dosage').value.trim();
                const freq = row.querySelector('.med-frequency').value.trim();
                const dur = row.querySelector('.med-duration').value.trim();

                if (name && dosage && freq && dur) {
                    presc.medicines.push({ name, dosage, frequency: freq, duration: dur });
                }
            });

            if (presc.medicines.length === 0) {
                alert('You must provide at least one medication details before saving.');
                return;
            }

            // Link to appointment if shortcut booking used
            const apptId = prescriptionForm.getAttribute('data-appt-id');
            if (apptId) {
                presc.appointmentId = apptId;
                // Auto complete appointment
                window.db.updateAppointmentStatus(apptId, 'Completed');
            }

            const added = window.db.addPrescription(presc);
            alert(`Prescription record logged successfully: ${added.id}. Pharmacy flat charges added to invoice.`);
            window.closeModal('prescription-modal');
            renderPrescriptionsTable();
        });
    }

    // 8. Custom Invoice form
    const invoiceForm = document.getElementById('invoice-form');
    if (invoiceForm) {
        invoiceForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const bill = {
                patientId: document.getElementById('bill-patient').value,
                date: document.getElementById('bill-date').value,
                discount: parseFloat(document.getElementById('bill-discount').value) || 0,
                status: 'Unpaid',
                paymentMethod: '',
                items: []
            };

            const itemRows = document.querySelectorAll('.invoice-item-row');
            itemRows.forEach(row => {
                const desc = row.querySelector('.bill-item-desc').value.trim();
                const cost = parseFloat(row.querySelector('.bill-item-cost').value) || 0;
                if (desc && cost > 0) {
                    bill.items.push({ description: desc, amount: cost });
                }
            });

            if (bill.items.length === 0) {
                alert('Add at least one billing item with cost.');
                return;
            }

            const created = window.db.addBill(bill);
            alert(`Custom Invoice generated successfully! ID: ${created.id}`);
            window.closeModal('invoice-modal');
            renderBillingTable();
        });
    }

    // 9. Payment processor form
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const billId = document.getElementById('pay-invoice-id').value;
            const method = document.getElementById('payment-method').value;

            window.db.payBill(billId, method);
            alert(`Payment transaction approved! Invoice ${billId} status set to Paid.`);
            window.closeModal('payment-modal');
            renderBillingTable();
        });
    }
}
