-- ============================================================
-- HMS ROLES & PERMISSIONS
-- ============================================================

-- Create roles safely (no error if they already exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin') THEN
        CREATE ROLE admin LOGIN PASSWORD 'admin123';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'doctor') THEN
        CREATE ROLE doctor LOGIN PASSWORD 'doctor123';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'nurse') THEN
        CREATE ROLE nurse LOGIN PASSWORD 'nurse123';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'patient') THEN
        CREATE ROLE patient LOGIN PASSWORD 'patient123';
    END IF;
END
$$;

-- ============================================================
-- ADMIN ROLE — Full access to all tables, views, and functions
-- ============================================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;

GRANT EXECUTE ON FUNCTION fn_register_patient(
    VARCHAR, VARCHAR, DATE, gender_type, VARCHAR, VARCHAR,
    blood_group, DECIMAL, DECIMAL, VARCHAR, VARCHAR,
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, INT
) TO admin;

GRANT EXECUTE ON FUNCTION fn_generate_bill(INT) TO admin;

GRANT EXECUTE ON FUNCTION fn_create_case_request(
    INT, INT, TEXT, condition_type,
    DECIMAL, INT, INT, INT, DECIMAL, DECIMAL, TEXT,
    INT, case_urgency, TEXT
) TO admin;

GRANT EXECUTE ON FUNCTION fn_accept_reject_case(INT, INT, VARCHAR, TEXT) TO admin;
GRANT EXECUTE ON FUNCTION fn_add_diagnosis(INT, INT, severity_type, TEXT, INT) TO admin;
GRANT EXECUTE ON FUNCTION fn_order_lab_test(INT, INT, INT) TO admin;
GRANT EXECUTE ON FUNCTION fn_nurse_fill_lab_report(INT, INT, VARCHAR) TO admin;
GRANT EXECUTE ON FUNCTION fn_submit_feedback(INT, INT, INT, SMALLINT, TEXT) TO admin;

GRANT SELECT ON
    vw_doctor_case_dashboard,
    vw_patient_appointments_bills,
    vw_patient_medical_history,
    vw_open_cases_by_dept,
    vw_nurse_assessment_dashboard,
    vw_nurse_profile,
    vw_doctor_diagnosis,
    vw_doctor_prescription,
    vw_doctor_lab_reports,
    vw_doctor_profile,
    vw_patient_lab_report,
    vw_patient_assessment,
    vw_patient_insurance,
    vw_patient_prescription
TO admin;


-- ============================================================
-- DOCTOR ROLE — Diagnose, order labs, accept/reject cases
-- ============================================================
GRANT SELECT ON
    vw_doctor_case_dashboard,
    vw_open_cases_by_dept,
    vw_doctor_diagnosis,
    vw_doctor_prescription,
    vw_doctor_lab_reports,
    vw_doctor_profile,
    LabTest,
    Disease
TO doctor;

GRANT EXECUTE ON FUNCTION fn_accept_reject_case(INT, INT, VARCHAR, TEXT) TO doctor;
GRANT EXECUTE ON FUNCTION fn_add_diagnosis(INT, INT, severity_type, TEXT, INT) TO doctor;
GRANT EXECUTE ON FUNCTION fn_order_lab_test(INT, INT, INT) TO doctor;


-- ============================================================
-- NURSE ROLE — Create assessments/cases, fill lab reports
-- ============================================================
GRANT SELECT ON
    vw_nurse_profile,
    vw_nurse_assessment_dashboard,
    vw_open_cases_by_dept
TO nurse;

GRANT EXECUTE ON FUNCTION fn_create_case_request(
    INT, INT, TEXT, condition_type,
    DECIMAL, INT, INT, INT, DECIMAL, DECIMAL, TEXT,
    INT, case_urgency, TEXT
) TO nurse;

GRANT EXECUTE ON FUNCTION fn_nurse_fill_lab_report(INT, INT, VARCHAR) TO nurse;


-- ============================================================
-- PATIENT ROLE — View own data, submit feedback
-- ============================================================
GRANT SELECT ON
    vw_patient_lab_report,
    vw_patient_assessment,
    vw_patient_insurance,
    vw_patient_prescription,
    vw_patient_appointments_bills,
    vw_patient_medical_history
TO patient;

GRANT EXECUTE ON FUNCTION fn_submit_feedback(INT, INT, INT, SMALLINT, TEXT) TO patient;
