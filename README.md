<div align="center">

# 🏥 Aarogya HMS
### *आरोग्य — Complete Wellbeing*

**A full-stack Hospital Management System built for the real world.**  
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

## ✨ What Is Aarogya?

Aarogya is a **production-grade, full-stack Hospital Management System** that digitizes the complete patient journey — from the moment they walk in, through triage, consultation, lab tests, prescription, admission, and final billing.

It's built for three kinds of humans:

| Role | What they get |
|------|--------------|
| 🏢 **Admin** | Live dashboards, staff management, room control, financial oversight |
| 🩺 **Doctor / Nurse** | Case management, triage vitals, diagnosis tools, prescriptions |
| 👤 **Patient** | Self-service portal, case history, lab results, printable summaries |

---

## 🚀 Features

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