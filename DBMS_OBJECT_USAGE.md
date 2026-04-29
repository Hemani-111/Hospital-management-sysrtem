# DBMS Object Usage Evidence (HMS Aarogya)

This file exists to make it easy to show your DBMS instructor *exactly* which written SQL objects were used by the backend.

## SQL Views used (`vw_*`)

### `vw_open_cases_by_dept`
- **Backend**: `server/routes/patients.js`
- **Endpoint**: `GET /api/patients/assessments/pending`
- **Purpose**: Get open triage cases that are not yet assessed.

### `vw_doctor_case_dashboard`
- **Backend**: `server/routes/clinical.js`
- **Endpoint**: `GET /api/cases/:id`
- **Purpose**: Fetch core case + patient + doctor + department + (single) assessment-vitals in one place for the doctor “Case Detail” page.

### `vw_doctor_diagnosis`
- **Backend**: `server/routes/patients.js`
- **Endpoint**: `GET /api/patients/portal/cases/:id`
- **Purpose**: Build `case.diagnosis[]` for the Patient “My Cases” view.

- **Backend**: `server/routes/clinical.js`
- **Endpoint**: `GET /api/cases/:id`
- **Purpose**: Build `caseDetail.diagnosis[]` for the Doctor “Case Detail” screen.

### `vw_doctor_prescription`
- **Backend**: `server/routes/patients.js`
- **Endpoint**: `GET /api/patients/portal/cases/:id`
- **Purpose**: Build `case.prescription[]` for the Patient “My Cases” view.

- **Backend**: `server/routes/clinical.js`
- **Endpoint**: `GET /api/cases/:id`
- **Purpose**: Build `caseDetail.prescription[]` for the Doctor “Case Detail” screen.

### `vw_patient_lab_report`
- **Backend**: `server/routes/patients.js`
- **Endpoint**: `GET /api/patients/portal/cases/:id`
- **Purpose**: Build `case.labreport[]` for the Patient “My Cases” lab tab.

- **Backend**: `server/routes/patients.js`
- **Endpoint**: `GET /api/patients/portal/lab-reports/:id`
- **Purpose**: Provide patient lab-report data (completed results view) to the backend API.

### `vw_patient_appointments_bills`
- **Backend**: `server/routes/patients.js`
- **Endpoint**: `GET /api/patients/portal/bills/:id`
- **Purpose**: Provide patient bill summary fields to the Patient dashboard (used by `PatientDashboard`).

- **Backend**: `server/routes/patients.js`
- **Endpoint**: `GET /api/patients/portal/appointments/:id`
- **Purpose**: Provide patient appointments with doctor context (view-based, though currently not heavily used by UI).

### `vw_doctor_lab_reports`
- **Backend**: `server/routes/clinical.js`
- **Endpoint**: `GET /api/lab-tests/case/:id`
- **Purpose**: Fetch doctor-specific ordered/completed lab reports for the Case Detail “Lab” tab.

### `vw_patient_medical_history`
- **Backend**: `server/routes/clinical.js`
- **Endpoint**: `GET /api/cases/patient/:id`
- **Purpose**: Feed the Nurse/Staff “Patient Records” page with a summarized patient EHR timeline.

## SQL Stored Functions used (`fn_*`)

### `fn_register_patient`
- **Backend**: `server/routes/patients.js`
- **Endpoint**: `POST /api/patients`
- **Purpose**: Validate & insert a new patient record (signup code generation) when full fields are provided.

### `fn_create_case_request`
- **Backend**: `server/routes/patients.js`
- **Endpoint**: `POST /api/patients/assessments`
- **Purpose**: Create a vitals assessment + open case request, and optionally assign it to a department.

### `fn_submit_feedback`
- **Backend**: `server/routes/patients.js`
- **Endpoint**: `POST /api/patients/feedback`
- **Purpose**: Validate + insert feedback for resolved cases.

### `fn_generate_bill`
- **Backend**: `server/routes/billing.js`
- **Endpoint**: `POST /api/billing/generate/:id`
- **Purpose**: Insert a bill row aggregated from a case request (consultation + labs + room + meds + insurance coverage).

### `fn_accept_reject_case`
- **Backend**: `server/routes/clinical.js`
- **Endpoint**: `PATCH /api/cases/:id/status`
- **Purpose**: Encapsulate accept/reject logic for case requests (doctor must accept only valid open cases).

### `fn_add_diagnosis`
- **Backend**: `server/routes/clinical.js`
- **Endpoint**: `POST /api/cases/diagnosis`
- **Purpose**: Insert diagnosis for accepted/in-progress cases and advance case status.

### `fn_order_lab_test`
- **Backend**: `server/routes/clinical.js`
- **Endpoint**: `POST /api/lab-tests`
- **Purpose**: Order a lab test through DB logic (creates corresponding labreport row safely).

### `fn_nurse_fill_lab_report`
- **Backend**: `server/routes/clinical.js`
- **Endpoint**: `PATCH /api/lab-tests/:id`
- **Purpose**: Allow nurse to fill a lab report with the measured test value and mark it resulted.

## SQL Triggers used (`trg_*`)

> Triggers are not called directly from backend code; they fire automatically when backend routes insert/update the related tables.

### `trg_prevent_double_booking` (function: `prevent_double_booking`)
- **Trigger file**: `database/triggers.sql`
- **Fires on**: `Appointment` BEFORE INSERT/UPDATE
- **Backend writes that cause it**:
  - `server/routes/clinical.js` `POST /api/appointments` (creates appointment rows)

### `trg_auto_complete_case` (function: `auto_complete_case`)
- **Trigger file**: `database/triggers.sql`
- **Fires on**: `CaseRequest` BEFORE UPDATE
- **Backend writes that cause it**:
  - `server/routes/facility.js` `PATCH /api/admissions/:id/discharge` (sets `DischargedOn`, which causes the trigger to set `Status = 'Resolved'`)

### `trg_calculate_bill` (function: `calculate_total_bill`)
- **Trigger file**: `database/triggers.sql`
- **Fires on**: `Bill` BEFORE INSERT/UPDATE
- **Backend writes that cause it**:
  - `server/routes/billing.js` `POST /api/billing/generate/:id` via `fn_generate_bill` (bill row insert triggers totals calculation)

### `trg_room_status` (function: `update_room_status`)
- **Trigger file**: `database/triggers.sql`
- **Fires on**: `CaseRequest` AFTER INSERT/UPDATE
- **Backend writes that cause it**:
  - `server/routes/facility.js` `PATCH /api/admissions/:id/admit` (marks `IsAdmitted = TRUE` + room assignment)
  - `server/routes/facility.js` `PATCH /api/admissions/:id/discharge` (marks discharged, clears room, updates discharge timestamp)

### `trg_lab_result_time` (function: `set_resulted_time`)
- **Trigger file**: `database/triggers.sql`
- **Fires on**: `LabReport` BEFORE UPDATE
- **Backend writes that cause it**:
  - `server/routes/clinical.js` `PATCH /api/lab-tests/:id` via `fn_nurse_fill_lab_report` (updates lab status to `Resulted`)

### `trg_notify_emergency` (function: `notify_emergency_case`)
- **Trigger file**: `database/triggers.sql`
- **Fires on**: `CaseRequest` AFTER INSERT
- **Backend writes that cause it**:
  - `server/routes/patients.js` `POST /api/patients/assessments` via `fn_create_case_request` (when `Urgency = 'Emergency'`, notification is inserted automatically)

### `trg_notify_feedback` (function: `notify_new_feedback`)
- **Trigger file**: `database/triggers.sql`
- **Fires on**: `Feedback` AFTER INSERT
- **Backend writes that cause it**:
  - `server/routes/patients.js` `POST /api/patients/feedback` via `fn_submit_feedback` (inserts a feedback row, notification is created by trigger)

