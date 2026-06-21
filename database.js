/**
 * database.js
 * Mock database layer for the Hospital Management System.
 * Stores data in localStorage and seeds with initial records if empty.
 */

const DB_KEYS = {
    PATIENTS: 'hms_patients',
    DOCTORS: 'hms_doctors',
    APPOINTMENTS: 'hms_appointments',
    PRESCRIPTIONS: 'hms_prescriptions',
    BILLS: 'hms_bills'
};

// Seed Data
const DEFAULT_DOCTORS = [
    {
        id: 'DOC001',
        name: 'Dr. Helen Carter',
        specialty: 'Cardiologist',
        department: 'Cardiology',
        email: 'helen.carter@hospital.com',
        phone: '+1 (555) 021-9988',
        password: 'password123',
        availability: {
            'Monday': ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00'],
            'Wednesday': ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00']
        }
    },
    {
        id: 'DOC002',
        name: 'Dr. James Wilson',
        specialty: 'Pediatrician',
        department: 'Pediatrics',
        email: 'james.wilson@hospital.com',
        phone: '+1 (555) 022-7766',
        password: 'password123',
        availability: {
            'Tuesday': ['10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00'],
            'Thursday': ['10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00']
        }
    },
    {
        id: 'DOC003',
        name: 'Dr. Robert Chen',
        specialty: 'Orthopedic Surgeon',
        department: 'Orthopedics',
        email: 'robert.chen@hospital.com',
        phone: '+1 (555) 023-5544',
        password: 'password123',
        availability: {
            'Wednesday': ['14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00'],
            'Friday': ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00']
        }
    },
    {
        id: 'DOC004',
        name: 'Dr. Sarah Patel',
        specialty: 'Neurologist',
        department: 'Neurology',
        email: 'sarah.patel@hospital.com',
        phone: '+1 (555) 024-3322',
        password: 'password123',
        availability: {
            'Monday': ['10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00'],
            'Thursday': ['14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00']
        }
    },
    {
        id: 'DOC005',
        name: 'Dr. Marcus Vance',
        specialty: 'General Practitioner',
        department: 'General Medicine',
        email: 'marcus.vance@hospital.com',
        phone: '+1 (555) 025-1100',
        password: 'password123',
        availability: {
            'Monday': ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00'],
            'Tuesday': ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00'],
            'Wednesday': ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00'],
            'Thursday': ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00'],
            'Friday': ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00']
        }
    }
];

const DEFAULT_PATIENTS = [
    {
        id: 'PAT001',
        name: 'John Doe',
        dob: '1985-05-15',
        gender: 'Male',
        phone: '+1 (555) 019-2834',
        email: 'john.doe@email.com',
        address: '123 Maple St, Springfield',
        emergencyContact: 'Jane Doe (+1 555-019-2835)',
        registrationDate: '2026-05-10'
    },
    {
        id: 'PAT002',
        name: 'Sarah Jenkins',
        dob: '1992-09-22',
        gender: 'Female',
        phone: '+1 (555) 014-9988',
        email: 'sarah.j@email.com',
        address: '456 Oak Ave, Riverdale',
        emergencyContact: 'Robert Jenkins (+1 555-014-9989)',
        registrationDate: '2026-05-18'
    },
    {
        id: 'PAT003',
        name: 'Michael Chang',
        dob: '1978-11-02',
        gender: 'Male',
        phone: '+1 (555) 012-3456',
        email: 'm.chang@email.com',
        address: '789 Pine Rd, Metro City',
        emergencyContact: 'Linda Chang (+1 555-012-3457)',
        registrationDate: '2026-06-01'
    },
    {
        id: 'PAT004',
        name: 'Emily Rodriguez',
        dob: '2005-04-12',
        gender: 'Female',
        phone: '+1 (555) 018-7654',
        email: 'emily.r@email.com',
        address: '101 Cedar Ln, Lakeside',
        emergencyContact: 'Carlos Rodriguez (+1 555-018-7655)',
        registrationDate: '2026-06-05'
    },
    {
        id: 'PAT005',
        name: 'David Kim',
        dob: '1963-07-30',
        gender: 'Male',
        phone: '+1 (555) 017-1122',
        email: 'd.kim@email.com',
        address: '222 Birch Dr, Hill Valley',
        emergencyContact: 'Sun-Hee Kim (+1 555-017-1123)',
        registrationDate: '2026-06-12'
    }
];

const DEFAULT_APPOINTMENTS = [
    {
        id: 'APT001',
        patientId: 'PAT001',
        doctorId: 'DOC001',
        date: '2026-06-15',
        timeSlot: '10:00 - 11:00',
        reason: 'Regular cardiac checkup',
        status: 'Completed'
    },
    {
        id: 'APT002',
        patientId: 'PAT002',
        doctorId: 'DOC002',
        date: '2026-06-16',
        timeSlot: '11:00 - 12:00',
        reason: 'Child immunization',
        status: 'Completed'
    },
    {
        id: 'APT003',
        patientId: 'PAT003',
        doctorId: 'DOC003',
        date: '2026-06-17',
        timeSlot: '15:00 - 16:00',
        reason: 'Knee joint pain check',
        status: 'Completed'
    },
    {
        id: 'APT004',
        patientId: 'PAT004',
        doctorId: 'DOC004',
        date: '2026-06-18',
        timeSlot: '11:00 - 12:00',
        reason: 'Persistent migraine headache',
        status: 'Completed'
    },
    {
        id: 'APT005',
        patientId: 'PAT005',
        doctorId: 'DOC005',
        date: '2026-06-22',
        timeSlot: '10:00 - 11:00',
        reason: 'Routine health checkup',
        status: 'Scheduled'
    },
    {
        id: 'APT006',
        patientId: 'PAT001',
        doctorId: 'DOC005',
        date: '2026-06-22',
        timeSlot: '11:00 - 12:00',
        reason: 'Follow up blood pressure check',
        status: 'Scheduled'
    }
];

const DEFAULT_PRESCRIPTIONS = [
    {
        id: 'PRC001',
        appointmentId: 'APT001',
        patientId: 'PAT001',
        doctorId: 'DOC001',
        date: '2026-06-15',
        diagnosis: 'Stage 1 Hypertension',
        medicines: [
            { name: 'Lisinopril', dosage: '20mg', frequency: 'Once daily (morning)', duration: '30 days' },
            { name: 'Atorvastatin', dosage: '10mg', frequency: 'Once daily (night)', duration: '30 days' }
        ],
        notes: 'Monitor blood pressure daily. Restrict dietary sodium. Return for review in 4 weeks.'
    },
    {
        id: 'PRC002',
        appointmentId: 'APT002',
        patientId: 'PAT002',
        doctorId: 'DOC002',
        date: '2026-06-16',
        diagnosis: 'Mild seasonal rhinovirus infection (Common Cold)',
        medicines: [
            { name: 'Acetaminophen Syrup', dosage: '120mg/5ml', frequency: '5ml every 6 hours as needed', duration: '5 days' },
            { name: 'Saline Nasal Drops', dosage: '0.9%', frequency: '2 drops per nostril, thrice daily', duration: '3 days' }
        ],
        notes: 'Ensure plenty of warm fluids and bed rest. Monitor temperature.'
    },
    {
        id: 'PRC003',
        appointmentId: 'APT003',
        patientId: 'PAT003',
        doctorId: 'DOC003',
        date: '2026-06-17',
        diagnosis: 'Early Bilateral Knee Osteoarthritis',
        medicines: [
            { name: 'Ibuprofen', dosage: '400mg', frequency: 'Twice daily after meals', duration: '10 days' },
            { name: 'Glucosamine Sulfate', dosage: '500mg', frequency: 'Once daily', duration: '90 days' }
        ],
        notes: 'Avoid running/strenuous impact activities. Apply hot compress for stiffness, cold compress for swelling.'
    },
    {
        id: 'PRC004',
        appointmentId: 'APT004',
        patientId: 'PAT004',
        doctorId: 'DOC004',
        date: '2026-06-18',
        diagnosis: 'Classic Migraine with Aura',
        medicines: [
            { name: 'Sumatriptan', dosage: '50mg', frequency: 'One dose at onset of aura; repeat in 2 hours if needed', duration: '10 doses' },
            { name: 'Magnesium Oxide', dosage: '400mg', frequency: 'Once daily (with food)', duration: '30 days' }
        ],
        notes: 'Rest in a dark, quiet room during attacks. Track triggers using headache diary. Limit caffeine.'
    }
];

const DEFAULT_BILLS = [
    {
        id: 'BIL001',
        patientId: 'PAT001',
        appointmentId: 'APT001',
        date: '2026-06-15',
        items: [
            { description: 'Cardiology Consultation Fee', amount: 120.00 },
            { description: 'Electrocardiogram (ECG) Diagnostic', amount: 80.00 }
        ],
        total: 200.00,
        tax: 10.00, // 5%
        discount: 20.00, // 10%
        grandTotal: 190.00,
        status: 'Paid',
        paymentMethod: 'Card'
    },
    {
        id: 'BIL002',
        patientId: 'PAT002',
        appointmentId: 'APT002',
        date: '2026-06-16',
        items: [
            { description: 'Pediatric General Consultation', amount: 70.00 },
            { description: 'MMR Vaccine Admin Fee', amount: 20.00 }
        ],
        total: 90.00,
        tax: 4.50,
        discount: 0.00,
        grandTotal: 94.50,
        status: 'Paid',
        paymentMethod: 'Cash'
    },
    {
        id: 'BIL003',
        patientId: 'PAT003',
        appointmentId: 'APT003',
        date: '2026-06-17',
        items: [
            { description: 'Orthopedics Special Consultation', amount: 110.00 },
            { description: 'Bilateral Knee X-ray Imaging', amount: 150.00 }
        ],
        total: 260.00,
        tax: 13.00,
        discount: 15.00,
        grandTotal: 258.00,
        status: 'Paid',
        paymentMethod: 'Insurance'
    },
    {
        id: 'BIL004',
        patientId: 'PAT004',
        appointmentId: 'APT004',
        date: '2026-06-18',
        items: [
            { description: 'Neurology Consultation Fee', amount: 130.00 }
        ],
        total: 130.00,
        tax: 6.50,
        discount: 0.00,
        grandTotal: 136.50,
        status: 'Unpaid',
        paymentMethod: ''
    },
    {
        id: 'BIL005',
        patientId: 'PAT005',
        appointmentId: 'APT005',
        date: '2026-06-22',
        items: [
            { description: 'General Practice Initial Consultation', amount: 70.00 }
        ],
        total: 70.00,
        tax: 3.50,
        discount: 0.00,
        grandTotal: 73.50,
        status: 'Unpaid',
        paymentMethod: ''
    }
];

class MockDatabase {
    constructor() {
        this.init();
    }

    init() {
        // Clear old database to ensure seeded passwords update
        if (localStorage.getItem(DB_KEYS.DOCTORS) && !JSON.parse(localStorage.getItem(DB_KEYS.DOCTORS))[0].password) {
            localStorage.removeItem(DB_KEYS.DOCTORS);
        }

        if (!localStorage.getItem(DB_KEYS.DOCTORS)) {
            localStorage.setItem(DB_KEYS.DOCTORS, JSON.stringify(DEFAULT_DOCTORS));
        }
        if (!localStorage.getItem(DB_KEYS.PATIENTS)) {
            localStorage.setItem(DB_KEYS.PATIENTS, JSON.stringify(DEFAULT_PATIENTS));
        }
        if (!localStorage.getItem(DB_KEYS.APPOINTMENTS)) {
            localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(DEFAULT_APPOINTMENTS));
        }
        if (!localStorage.getItem(DB_KEYS.PRESCRIPTIONS)) {
            localStorage.setItem(DB_KEYS.PRESCRIPTIONS, JSON.stringify(DEFAULT_PRESCRIPTIONS));
        }
        if (!localStorage.getItem(DB_KEYS.BILLS)) {
            localStorage.setItem(DB_KEYS.BILLS, JSON.stringify(DEFAULT_BILLS));
        }
    }

    // Helper functions
    _get(key) {
        return JSON.parse(localStorage.getItem(key)) || [];
    }

    _set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // Generate unique sequential IDs
    _nextId(prefix, records) {
        if (records.length === 0) return `${prefix}001`;
        const lastId = records[records.length - 1].id;
        const numPart = parseInt(lastId.replace(prefix, ''), 10);
        return `${prefix}${String(numPart + 1).padStart(3, '0')}`;
    }

    // Auth logic
    authenticateUser(email, password) {
        // 1. Check Admin
        if (email.toLowerCase() === 'admin@caresync.com' && password === 'admin123') {
            return {
                id: 'ADM001',
                name: 'System Administrator',
                email: 'admin@caresync.com',
                role: 'Admin',
                avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'
            };
        }

        // 2. Check Doctors
        const doctors = this.getDoctors();
        const doc = doctors.find(d => d.email.toLowerCase() === email.toLowerCase() && d.password === password);
        if (doc) {
            return {
                id: doc.id,
                name: doc.name,
                email: doc.email,
                specialty: doc.specialty,
                department: doc.department,
                role: 'Doctor',
                avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150'
            };
        }

        return null;
    }

    // Patients CRUD
    getPatients() {
        return this._get(DB_KEYS.PATIENTS);
    }

    getPatient(id) {
        return this.getPatients().find(p => p.id === id);
    }

    addPatient(patient) {
        const patients = this.getPatients();
        patient.id = this._nextId('PAT', patients);
        patient.registrationDate = new Date().toISOString().split('T')[0];
        patients.push(patient);
        this._set(DB_KEYS.PATIENTS, patients);
        return patient;
    }

    updatePatient(updatedPatient) {
        const patients = this.getPatients();
        const index = patients.findIndex(p => p.id === updatedPatient.id);
        if (index !== -1) {
            patients[index] = { ...patients[index], ...updatedPatient };
            this._set(DB_KEYS.PATIENTS, patients);
            return true;
        }
        return false;
    }

    deletePatient(id) {
        let patients = this.getPatients();
        patients = patients.filter(p => p.id !== id);
        this._set(DB_KEYS.PATIENTS, patients);
        return true;
    }

    // Doctors CRUD
    getDoctors() {
        return this._get(DB_KEYS.DOCTORS);
    }

    getDoctor(id) {
        return this.getDoctors().find(d => d.id === id);
    }

    addDoctor(doctor) {
        const doctors = this.getDoctors();
        doctor.id = this._nextId('DOC', doctors);
        
        // Auto-inject basic availability if none provided
        if (!doctor.availability || Object.keys(doctor.availability).length === 0) {
            doctor.availability = {
                'Monday': ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '14:00 - 15:00'],
                'Tuesday': ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00'],
                'Wednesday': ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '14:00 - 15:00'],
                'Thursday': ['09:00 - 10:00', '10:00 - 11:00'],
                'Friday': ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '15:00 - 16:00']
            };
        }
        
        doctors.push(doctor);
        this._set(DB_KEYS.DOCTORS, doctors);
        return doctor;
    }

    updateDoctor(updatedDoctor) {
        const doctors = this.getDoctors();
        const index = doctors.findIndex(d => d.id === updatedDoctor.id);
        if (index !== -1) {
            doctors[index] = { ...doctors[index], ...updatedDoctor };
            this._set(DB_KEYS.DOCTORS, doctors);
            return true;
        }
        return false;
    }

    deleteDoctor(id) {
        let doctors = this.getDoctors();
        doctors = doctors.filter(d => d.id !== id);
        this._set(DB_KEYS.DOCTORS, doctors);
        return true;
    }

    // Appointments CRUD
    getAppointments() {
        return this._get(DB_KEYS.APPOINTMENTS);
    }

    getAppointment(id) {
        return this.getAppointments().find(a => a.id === id);
    }

    isSlotAvailable(doctorId, date, timeSlot, excludeAppointmentId = null) {
        const appointments = this.getAppointments();
        return !appointments.some(a => 
            a.doctorId === doctorId && 
            a.date === date && 
            a.timeSlot === timeSlot && 
            a.status !== 'Cancelled' &&
            a.id !== excludeAppointmentId
        );
    }

    addAppointment(appointment) {
        const appointments = this.getAppointments();
        appointment.id = this._nextId('APT', appointments);
        appointments.push(appointment);
        this._set(DB_KEYS.APPOINTMENTS, appointments);

        // Auto-create a pending bill when booking an appointment if General or Specialty GP consultation
        const doctor = this.getDoctor(appointment.doctorId);
        if (doctor) {
            const fee = doctor.specialty === 'General Practitioner' ? 70.00 : 120.00;
            this.addBill({
                patientId: appointment.patientId,
                appointmentId: appointment.id,
                date: appointment.date,
                items: [{ description: `${doctor.specialty} Consultation Fee`, amount: fee }],
                status: 'Unpaid',
                paymentMethod: ''
            });
        }

        return appointment;
    }

    updateAppointmentStatus(id, status) {
        const appointments = this.getAppointments();
        const index = appointments.findIndex(a => a.id === id);
        if (index !== -1) {
            appointments[index].status = status;
            this._set(DB_KEYS.APPOINTMENTS, appointments);
            return true;
        }
        return false;
    }

    // Prescriptions CRUD
    getPrescriptions() {
        return this._get(DB_KEYS.PRESCRIPTIONS);
    }

    getPrescription(id) {
        return this.getPrescriptions().find(p => p.id === id);
    }

    addPrescription(prescription) {
        const prescriptions = this.getPrescriptions();
        prescription.id = this._nextId('PRC', prescriptions);
        prescription.date = new Date().toISOString().split('T')[0];
        prescriptions.push(prescription);
        this._set(DB_KEYS.PRESCRIPTIONS, prescriptions);

        // Add pharmaceutical items to existing unpaid invoice if available, or create new one
        const bills = this.getBills();
        let bill = bills.find(b => b.appointmentId === prescription.appointmentId);
        
        if (bill) {
            prescription.medicines.forEach(m => {
                // Mock cost for medicines
                bill.items.push({
                    description: `Pharmacy: ${m.name} (${m.dosage})`,
                    amount: 15.00 // Standard flat rate mock cost for medicines
                });
            });
            // Recompute totals
            bill.total = bill.items.reduce((sum, item) => sum + item.amount, 0);
            bill.tax = Math.round((bill.total * 0.05) * 100) / 100;
            bill.grandTotal = Math.round((bill.total + bill.tax - bill.discount) * 100) / 100;
            this.updateBill(bill);
        }

        return prescription;
    }

    // Billing CRUD
    getBills() {
        return this._get(DB_KEYS.BILLS);
    }

    getBill(id) {
        return this.getBills().find(b => b.id === id);
    }

    addBill(bill) {
        const bills = this.getBills();
        bill.id = this._nextId('BIL', bills);
        if (!bill.date) bill.date = new Date().toISOString().split('T')[0];
        bill.total = bill.items.reduce((sum, item) => sum + item.amount, 0);
        bill.tax = Math.round((bill.total * 0.05) * 100) / 100; // 5% standard tax
        bill.discount = bill.discount || 0;
        bill.grandTotal = Math.round((bill.total + bill.tax - bill.discount) * 100) / 100;
        bills.push(bill);
        this._set(DB_KEYS.BILLS, bills);
        return bill;
    }

    updateBill(updatedBill) {
        const bills = this.getBills();
        const index = bills.findIndex(b => b.id === updatedBill.id);
        if (index !== -1) {
            bills[index] = { ...bills[index], ...updatedBill };
            // Recalculate totals
            bills[index].total = bills[index].items.reduce((sum, item) => sum + item.amount, 0);
            bills[index].tax = Math.round((bills[index].total * 0.05) * 100) / 100;
            bills[index].grandTotal = Math.round((bills[index].total + bills[index].tax - bills[index].discount) * 100) / 100;
            this._set(DB_KEYS.BILLS, bills);
            return true;
        }
        return false;
    }

    payBill(id, paymentMethod) {
        const bills = this.getBills();
        const index = bills.findIndex(b => b.id === id);
        if (index !== -1) {
            bills[index].status = 'Paid';
            bills[index].paymentMethod = paymentMethod;
            this._set(DB_KEYS.BILLS, bills);
            return true;
        }
        return false;
    }
}

// Instantiate and expose globally
window.db = new MockDatabase();
