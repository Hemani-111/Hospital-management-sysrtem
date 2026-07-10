<div align="center">

# 🏥 Aarogya HMS
### *आरोग्य — Complete Wellbeing*

**A full-stack Hospital Management System built for the real world.**  
*Developed as a comprehensive Database Management Systems (DBMS) course semester project.*  

From triage to discharge. From diagnosis to billing. One platform, zero chaos.

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 🌿 Why "Aarogya"?

**आरोग्य** (Aarogya) is a Sanskrit word meaning *"complete physical and mental wellbeing"* — not just the absence of sickness, but the fullness of health. It's the root of India's national health mission, found in Ayurveda texts thousands of years old.

When you say "Aarogya," you're not just naming software. You're making a promise.

> *"Sarve bhavantu sukhinah, sarve santu nirāmayāḥ"*  
> — May all be happy. May all be free from disease.

---

## 🎬 The "Why": Beyond Just Another Academic Project

Aarogya HMS was designed and built from scratch as our **Database Management Systems (DBMS) course semester project**. 

While most university DBMS projects are "toy projects"—a simple React frontend hooked up to a database doing basic CRUD operations (like inserting a student record or buying a book from a virtual shop)—they rarely reflect the chaos, complexity, and strict integrity requirements of the real world. 

We built **Aarogya HMS** to challenge that status quo. Here is the real motivation behind this project:

### 1. The Database as the Brain (Not Just a Dumb Bucket)
In typical modern applications, all business logic lives in the backend API (Node.js/Python), while the database is used as a simple storage bucket. If the API fails or a direct query is made, constraints can break. 

In Aarogya, **the database is the ultimate authority**. We pushed the limits of PostgreSQL:
* **Automated Financial Aggregation**: The billing system automatically calculates room fees, doctor consultation charges, and lab test costs instantly using database triggers (`trg_calculate_bill`) and SQL functions (`fn_generate_bill`) whenever a patient is discharged.
* **Overbooking Protection**: A custom trigger (`trg_prevent_double_booking`) runs directly on the database transaction level to prevent scheduling overlapping appointments for the same doctor, completely independent of the frontend code.
* **Automated Triage & Room Occupancy**: Room availability is dynamically updated in real-time by table triggers as patients are admitted and discharged, ensuring zero administrative errors.

### 2. Orchestrating a Multi-Actor Dance
A real hospital doesn't have one user. It is a highly coordinated, real-time collaboration between **Administrators, Nurses, Doctors, and Patients**. Aarogya is designed as a complete, closed-loop workflow:
* **The Nurse** initiates triage and records vitals (Blood Pressure, SpO₂, Temp).
* **The Doctor** instantly gets a live feed of these vitals, diagnoses the patient, and orders labs or medications.
* **The Patient** logs in securely using a generated passcode to download clinical summaries, check their lab history, and view receipts.
* **The Admin** monitors bed occupancy, tracks hospital revenue, and manages staff rosters from a live command center.

### 3. Production-Grade Aesthetics
We believe functional software should also be gorgeous. We designed a clean, cohesive glassmorphic design system using React 19, custom CSS tokens, premium animations, and responsive dashboards that make clinical management feel like a modern SaaS product, rather than clunky legacy medical software.

---

## ✨ What Is Aarogya?

Aarogya is a **production-grade, full-stack Hospital Management System** that digitizes the complete patient journey — from the moment they walk in, through triage, consultation, lab tests, prescription, admission, and final billing.

It's built for three kinds of humans:

| Role | What they get |
|------|--------------|
| 🏢 **Admin** | Live dashboards, staff management, room control, financial oversight |
| 🩺 **Doctor / Nurse** | Case management, triage vitals, diagnosis tools, prescriptions |
| 👤 **Patient** | Self-service portal, case history, lab results, printable summaries |

---

## 🚀 Features:

### 🏢 Admin Command Center
- **Live Stats Dashboard** — Real-time revenue, patient inflow, and bed occupancy powered by Recharts
- **Facility Management** — Dynamic control over Departments and Rooms (IPD / General)
- **Staff Oversight** — Full management of doctors, nurses, and administrative personnel

### 🩺 Clinical Intelligence
- **Dynamic Case Management** — Track patient cases from `Open` → `Resolved` with detailed status updates
- **Advanced Triage** — Nurse assessment system recording vitals: BP, SpO₂, Temperature, and initial symptoms
- **Precision Diagnosis** — Specialized disease lookup with severity-based diagnosis recording
- **Digital Prescriptions** — Instant generation of clear medical instructions and medicine lists

### 💰 Automated Financial Engine
- **Smart Billing** — Logic-based engine that aggregates consultation fees + room charges + lab tests into a clean invoice
- **Insurance Integration** — Real-time provider lookup and coverage calculation
- **Payment Lifecycle** — Track payments from `Unpaid` → `Settled`

### 👤 Patient Self-Service Portal
- Secure sign-up via a **one-time registration code**
- View full **case history**, **lab results**, and **prescriptions** anytime
- **Print Summary** — Professional, CSS-isolated clinical reports ready for printing or sharing

---

## 🔄 The Aarogya Workflow

A patient's journey, fully orchestrated across every role:

```
[1] CHECK-IN     → Admin registers or verifies the patient
[2] TRIAGE       → Nurse records vitals (BP, SpO₂, Temp) and symptoms
[3] CONSULTATION → Doctor reviews triage data, adds diagnosis, orders labs
[4] CLINICAL     → Lab tests run, prescriptions issued
[5] ADMISSION    → (Optional) Patient assigned to a room; beds update in real-time
[6] DISCHARGE    → Case resolved → bill auto-calculated → room freed → invoice sent
```

No dropped balls. No spreadsheets. No whiteboards.

---

## 📸 Screenshots

Explore the rich user interfaces and modules of **Aarogya HMS**, categorized by user portal.

<details open>
<summary>🏢 Admin Command Center (5 Screenshots)</summary>

### 1. Admin Dashboard
![Admin Dashboard](./screenshots/admin/dashboard.png)
*A comprehensive visual overview of the hospital's operations, showing real-time metrics such as total revenue, patient inflow, and room occupancy (IPD vs. General) with interactive charts.*

### 2. Patient Directory & List
![Patient List](./screenshots/admin/patient%20list.png)
*A unified directory of all patients registered in the database, allowing administrators to search, filter, and view patient profiles and clinical histories.*

### 3. Patient Creation
![Create Patient](./screenshots/admin/create%20patient.png)
*The administrative registration interface to enroll new patients, capture demographic data, and generate secure one-time credentials for the Patient Portal.*

### 4. Staff Management
![Staff Management](./screenshots/admin/manage%20staff.png)
*A role-based access control (RBAC) panel for administrators to manage, assign, and track doctors, nurses, and support staff across various departments.*

### 5. Bill Management & Financial Engine
![Bill Management](./screenshots/admin/bill%20management.png)
*An automated ledger that compiles consultation fees, lab diagnostic tests, and room rentals into a comprehensive invoice, showing payment statuses and insurance calculations.*

</details>

<details>
<summary>🩺 Doctor Portal (5 Screenshots)</summary>

### 1. Doctor Dashboard
![Doctor Dashboard](./screenshots/doctor/dashboard.png)
*The practitioner's cockpit, presenting active patient counts, scheduled appointments, and pending diagnostics at a glance.*

### 2. Appointment Scheduler
![Appointments Manager](./screenshots/doctor/appointments.png)
*A clean queue manager that allows doctors to track scheduled patient consultations, organize calendars, and launch diagnostics.*

### 3. Active Case Tracker
![My Cases](./screenshots/doctor/my%20cases.png)
*A dedicated interface to manage active patient cases, track longitudinal medical history, and mark cases as resolved upon successful discharge.*

### 4. Precision Diagnosis Form
![Diagnosis Entry](./screenshots/doctor/diagnosis.png)
*A detailed clinical form for selecting pre-configured ICD/disease items, assigning severity levels (Mild, Moderate, Severe), and documenting clinical notes.*

### 5. Lab Orders & Digital Prescriptions
![Lab Reports & Prescriptions](./screenshots/doctor/lab%20repors%20order.png)
*An integrated interface to order medical lab tests and draft precise digital prescriptions (medication, dosage, and frequency instructions) for patients.*

</details>

<details>
<summary>🥼 Nurse Clinical Portal (8 Screenshots)</summary>

### 1. Nurse Dashboard
![Nurse Dashboard](./screenshots/nurse/dashboard.png)
*A centralized workspace indicating triage status, ward occupancy, active rooms, and pending assessments in real time.*

### 2. Nurse Profile
![Nurse Profile](./screenshots/nurse/profile.png)
*A secure personal profile dashboard detailing active nursing credentials, assigned department, and roster shifts.*

### 3. Patient Records Directory
![Patient Records](./screenshots/nurse/patient%20records.png)
*A focused, searchable patient lookup used by nurses to retrieve assigned ward charts and review current treatment plans.*

### 4. Triage Assessments Log
![Assessments Log](./screenshots/nurse/assessments.png)
*A comprehensive record of previous clinical assessments and intake notes, displaying logs of patient updates.*

### 5. Triage Check-in Flow
![Triage Intake Form](./screenshots/nurse/assess%20patient%201.png)
*The initial digital intake page used during patient triage to begin record creation and document chief complaints.*

### 6. Vitals Entry Interface
![Record Vitals](./screenshots/nurse/recrod%20vitals.png)
*A precise clinical input screen to record core patient vitals, including Blood Pressure (Systolic/Diastolic), SpO₂ (Oxygen Saturation), Temperature (°F), and Respiratory Rate.*

### 7. Vitals Monitor Dashboard
![Vitals Monitor](./screenshots/nurse/vitals%20monitor.png)
*A visual chart dashboard detailing patient vitals tracking over time, alerting staff to critical fluctuations.*

### 8. Department Referrals
![Department Referral](./screenshots/nurse/dept%20referal.png)
*An administrative routing tool that lets nurses refer patients to other departments or rooms based on updated triage results.*

</details>

<details>
<summary>👤 Patient Self-Service Portal (3 Screenshots)</summary>

### 1. Patient Invoices & Billing
![Bills Overview](./screenshots/patient/bills.png)
*A clean invoice breakdown for the patient, showing billing line-items, insurance discounts, copays, and payment receipts.*

### 2. Patient Feedback & Rating Form
![Feedback Module](./screenshots/patient/feedback.png)
*An interactive feedback widget enabling patients to rate their primary care doctors and nurses, promoting continuous improvement in care.*

### 3. Patient Support Helpdesk
![Support Portal](./screenshots/patient/support.png)
*A secure patient support terminal containing hospital FAQs, direct query inputs, and messaging for non-emergency assistance.*

</details>

---

## 📊 Relational Model

The database entity relationships, schema layout, and table constraints of the Aarogya HMS system are fully documented in the relational model schema sheet:

📁 **[View / Download Relational Model PDF](./relational%20model.pdf)**

*This document contains detailed information on primary/foreign key mappings, attribute data types, check constraints, default triggers, and cascading referential integrity rules implemented at the PostgreSQL database level.*

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19 + Vite** | Blazing fast UI and dev server |
| **Tailwind CSS** | Glassmorphism design system with micro-animations |
| **TanStack Query v5** | Server-state management with caching and sync |
| **Zustand** | Lightweight global state |
| **Recharts** | Beautiful, responsive data visualizations |
| **Lucide + Material Icons** | Crisp, professional iconography |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | Scalable, non-blocking API architecture |
| **PostgreSQL** | Relational database with high data integrity |
| **JWT + RBAC** | Secure, role-based access control |
| **SQL Functions & Joins** | Automated billing logic and reporting |

---
## 👤 My Contribution

### Database & SQL Development
- Designed and implemented PostgreSQL database structures for the hospital management workflow.
- Created and optimized SQL queries, joins, and relational mappings for retrieving clinical and administrative data.
- Developed database-level logic using SQL functions and triggers for:
  - Automated bill calculation during patient discharge.
  - Updating room occupancy status automatically.
  - Maintaining data consistency through constraints and validations.
- Worked on database schema design, relationships, and integrity rules to support the application's core features.

---
## 📁 Project Architecture

Recently refactored into a domain-driven, modular backend — no monoliths here.

```
server/
├── routes/
│   ├── auth.js          # JWT login, signup, role verification
│   ├── patients.js      # Patient portal and profiles
│   ├── clinical.js      # Cases, lab tests, appointments
│   ├── billing.js       # Invoices, payments, insurance
│   ├── facility.js      # Rooms and departments
│   ├── employees.js     # Staff management
│   └── system.js        # Analytics and global search
├── database/
│   ├── schema.sql        # Tables, types, enums
│   ├── functions.sql     # Billing logic and auto-calc triggers
│   ├── views.sql         # Reporting views
│   └── seed_demo.sql     # Optional: demo data for testing
└── index.js              # Lightweight entry point
```

Each route file owns exactly one domain. Adding a feature means touching one file, not ten.

---

## 🏁 Getting Started

### Prerequisites
- PostgreSQL running locally (or via Docker)
- Node.js ≥ 18
- A `.env` file with `DATABASE_URL` and `JWT_SECRET`

### 1. Database Setup

Run these scripts from the `database/` folder **in order**:

```bash
psql -f database/schema.sql       # Tables, types, enums
psql -f database/functions.sql    # Billing logic and triggers
psql -f database/views.sql        # Reporting views
psql -f database/seed_demo.sql    # Optional: seed demo data
```

### 2. Backend

```bash
cd server
npm install
# Create a .env file:
# DATABASE_URL=postgres://user:password@localhost:5432/aarogya
# JWT_SECRET=your_super_secret_key
npm run dev
# API live at http://localhost:5000
```

### 3. Frontend

```bash
cd ..         # back to root
npm install
npm run dev
# App live at http://localhost:5173
```

That's it. Three commands per side and you're running.

---

## 🔐 Roles & Access

Aarogya uses **JWT-based Role-Based Access Control (RBAC)**. Every API route is protected, and every user sees exactly what they need — nothing more, nothing less.

```
ADMIN    → Full access: dashboard, staff, rooms, billing, reports
DOCTOR   → Cases, diagnoses, prescriptions, lab orders
NURSE    → Triage assessments, vitals recording
PATIENT  → Own case history, lab results, prescriptions only
```

---

## 🗺️ Roadmap

- [ ] **🤖 AI Diagnosis Assistant** — LLM-powered suggestions based on triage vitals and symptoms. The doctor still decides; AI just helps think faster.
- [ ] **📱 React Native App** — Dedicated mobile app for doctors on rounds: case updates, prescriptions, and triage alerts on the go.
- [ ] **🎥 Telemedicine** — Real-time video consultations built right into the platform. No third-party links, no tab-switching.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change. Make sure to update tests as needed.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

<div align="center">

Built with ❤️ in India 🇮🇳 for better healthcare, everywhere.

**Aarogya HMS** — *Data Driven. Patient Focused.*

*डेटा-संचालित, रोगी-केंद्रित*

</div>
