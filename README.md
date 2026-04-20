# <img src="public/logo.png" width="40" height="40" style="vertical-align: middle; margin-right: 10px;"> Nexus Health: The Ultimate Hospital Management System

Welcome to **Nexus Health**, a cutting-edge, full-stack Hospital Management System (HMS) designed to bridge the gap between complex clinical workflows and intuitive user experiences. Whether you're an Admin overseeing the entire hospital's pulse, a Doctor diagnosing cases, or a Patient tracking your recovery, Nexus Health provides a seamless digital ecosystem.

---

## 🚀 Key Features

### 🏢 Admin Control Center
- **Live Stats Dashboard**: Real-time visualization of revenue, patient inflow, and bed occupancy using **Recharts**.
- **Facility Management**: Dynamic control over Departments and Rooms (IPD/General).
- **Staff Oversight**: Comprehensive management of doctors, nurses, and administrative personnel.

### 🩺 Clinical Superpowers
- **Dynamic Case Management**: Track patient cases from "Open" to "Resolved" with detailed status updates.
- **Advanced Triage**: Integrated nurse assessment system recording vitals (BP, SpO2, Temp) and initial symptoms.
- **Precision Diagnosis**: Specialized lookup for diseases and severity-based diagnosis recording.
- **Digital Prescriptions**: Instant generation of clear medical instructions and medicine lists.

### 💰 Financial Engine
- **Automated Billing**: Logic-based billing that aggregates consultation fees, room charges, and lab tests into a professional invoice.
- **Insurance Integration**: Real-time provider lookup and coverage calculation.
- **Payment Lifecycle**: Track payments from "Unpaid" to "Settled".

### 👤 Patient Universe
- **Self-Service Portal**: Patients can register using a secure signup code, view their case history, and check lab results.
- **Print Summaries**: Professional, CSS-isolated "Print Summary" feature for clinical reports.
- **History Tracking**: Full chronological access to past assessments and diagnoses.

---

## 🛠️ The Tech Stack

### Frontend (Modern & Fast)
- **React 19 + Vite**: Blazing fast development and ultra-responsive UI.
- **Tailwind CSS**: Custom "Aesthetic-First" design system with glassmorphism and smooth micro-animations.
- **TanStack Query (v5)**: Robust server-state management with automated caching and synchronization.
- **Zustand**: Lightweight global state management for a snappy user experience.
- **Lucide & Material Icons**: Crisp, professional iconography.

### Backend (Secure & Scalable)
- **Node.js + Express**: Scalable, non-blocking API architecture.
- **PostgreSQL**: Relational database for high data integrity.
- **JWT Authorization**: Secure, role-based access control (RBAC).
- **Relational Integrity**: Complex SQL Joins and Functions for automated billing and reporting.

---

## 🔄 The Nexus Workflow

1.  **Check-in**: Patient is registered or verified in the Admin dashboard.
2.  **Triage**: A Nurse performs an assessment, recording vitals into the **Nexus Vitals System**.
3.  **Consultation**: An "Open Case" is created for the Doctor, who evaluates the triage data and adds a Diagnosis.
4.  **Clinical Steps**: Doctor orders Lab Tests or prescribes Medication.
5.  **Admission (Optional)**: If needed, the patient is admitted to a room, freeing or occupying beds in real-time.
6.  **Discharge & Billing**: Once resolved, the system auto-calculates the bill. The Admin frees the room and settles the financials.

---

## 📁 Modular Architecture

Recently refactored for professional-grade scalability, the backend is split into domain-specific controllers:

```
server/
├── routes/
│   ├── patients.js    # Patient portal & profiles
│   ├── clinical.js    # Cases, Lab, Appointments
│   ├── billing.js     # Payments & Invoices
│   ├── facility.js    # Rooms & Departments
│   ├── system.js      # Analytics & Global Search
│   ├── auth.js        # Safety first!
│   └── employees.js   # Staff management
├── database/          # SQL Schemas, Functions, and Seeds
└── index.js           # Lightweight entry point
```

---

## 🏁 Getting Started

### 1. Database Setup
Ensure you have PostgreSQL running. Run the following scripts from the `database/` folder:
1. `schema.sql` (Tables & Types)
2. `functions.sql` (Billing & Logic)
3. `views.sql` (Reporting)
4. `seed_demo_data.sql` (Optional: for testing)

### 2. Backend Installation
```bash
cd server
npm install
# Create a .env file with DATABASE_URL and JWT_SECRET
npm run dev
```

### 3. Frontend Installation
```bash
npm install
npm run dev
```

---

## 💡 Future Roadmap
- [ ] **AI Diagnosis Assistant**: Integrating LLMs to suggest common diagnoses based on triage data.
- [ ] **Telemedicine**: Real-time video consultation integration.
- [ ] **Mobile App**: A dedicated React Native app for doctors on the move.

---

Built with ❤️ for better healthcare. 
🏥 **Nexus Health** — *Data Driven, Patient Focused.*
