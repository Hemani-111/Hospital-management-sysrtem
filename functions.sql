---function1
CREATE OR REPLACE FUNCTION fn_register_patient(
    p_first_name            VARCHAR,
    p_last_name             VARCHAR,
    p_date_of_birth         DATE,
    p_gender                gender_type,
    p_phone_number          VARCHAR,
    p_emergency_contact     VARCHAR,
    p_blood_group           blood_group,
    p_height                DECIMAL,
    p_weight                DECIMAL,
    p_address_line1         VARCHAR,
    p_address_line2         VARCHAR,
    p_city                  VARCHAR,
    p_state                 VARCHAR,
    p_postal_code           VARCHAR,
    p_country               VARCHAR,
    p_created_by_admin_id   INT
)
RETURNS TABLE (
    patient_id  INT,
    signup_code VARCHAR,
    message     TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_patient_id    INT;
    v_signup_code   VARCHAR;
    v_admin_exists  BOOLEAN;
    v_admin_type    employee_type;
    v_seq_val       INT;
BEGIN
    -- ================================
    -- VALIDATION 1: Admin exists and is active
    -- ================================
    SELECT EXISTS (
        SELECT 1 FROM Employee
        WHERE EmployeeID = p_created_by_admin_id
        AND IsActive = TRUE
    ) INTO v_admin_exists;

    IF NOT v_admin_exists THEN
        RAISE EXCEPTION 'Admin with ID % does not exist or is inactive', 
            p_created_by_admin_id;
    END IF;

    -- ================================
    -- VALIDATION 2: Admin must be Admin type employee
    -- ================================
    SELECT EmployeeType INTO v_admin_type
    FROM Employee
    WHERE EmployeeID = p_created_by_admin_id;

    IF v_admin_type != 'Admin' THEN
        RAISE EXCEPTION 'Employee ID % is not an Admin. Only admins can register patients',
            p_created_by_admin_id;
    END IF;

    -- ================================
    -- VALIDATION 3: First name or last name not empty
    -- ================================
    IF TRIM(p_first_name) = '' OR p_first_name IS NULL or 
     TRIM(p_last_name) = '' OR p_last_name IS NULL THEN
        RAISE EXCEPTION 'name cannot be empty';
    END IF;

    

    -- ================================
    -- VALIDATION 4: Date of birth
    -- Cannot be in the future
    -- Cannot be more than 120 years ago
    -- ================================
    IF p_date_of_birth IS NULL THEN
        RAISE EXCEPTION 'Date of birth cannot be null';
    END IF;

    IF p_date_of_birth > CURRENT_DATE THEN
        RAISE EXCEPTION 'Date of birth cannot be in the future';
    END IF;

    
    -- ================================
    -- VALIDATION 5: Phone number
    -- Must be exactly 10 digits
    -- ================================
    IF p_phone_number IS NULL OR p_phone_number = '' THEN
        RAISE EXCEPTION 'Phone number cannot be empty';
    END IF;

    IF p_phone_number !~ '^\d{10}$' THEN
        RAISE EXCEPTION 'Phone number must be exactly 10 digits, got: %', 
            p_phone_number;
    END IF;

    -- ================================
    -- VALIDATION 6: Emergency contact
    -- Must be different from phone number
    -- Must be exactly 10 digits
    -- ================================
    IF p_emergency_contact IS NULL OR p_emergency_contact = '' THEN
        RAISE EXCEPTION 'Emergency contact cannot be empty';
    END IF;

    IF p_emergency_contact !~ '^\d{10}$' THEN
        RAISE EXCEPTION 'Emergency contact must be exactly 10 digits, got: %',
            p_emergency_contact;
    END IF;

    IF p_phone_number = p_emergency_contact THEN
        RAISE EXCEPTION 'Emergency contact must be different from phone number';
    END IF;

    -- ================================
    -- VALIDATION 7: Height and Weight
    -- Must be positive and realistic
    -- ================================
    IF p_height IS NOT NULL AND (p_height <= 0 OR p_height > 300) THEN
        RAISE EXCEPTION 'Height must be between 0 and 300 cm, got: %', p_height;
    END IF;

    IF p_weight IS NOT NULL AND (p_weight <= 0 OR p_weight > 500) THEN
        RAISE EXCEPTION 'Weight must be between 0 and 500 kg, got: %', p_weight;
    END IF;

    -- ================================
    -- VALIDATION 8: City and State not empty
    -- ================================
    IF TRIM(p_city) = '' OR p_city IS NULL THEN
        RAISE EXCEPTION 'City cannot be empty';
    END IF;

    IF TRIM(p_state) = '' OR p_state IS NULL THEN
        RAISE EXCEPTION 'State cannot be empty';
    END IF;

    -- ================================
    -- GENERATE UNIQUE SIGNUP CODE
    -- ================================
    SELECT NEXTVAL('patient_patientid_seq') INTO v_seq_val;

    v_signup_code := 'PAT' || TO_CHAR(NOW(), 'YYYY') ||
                     LPAD(v_seq_val::TEXT, 4, '0');

    -- ================================
    -- INSERT PATIENT
    -- ================================
    INSERT INTO Patient (
        SignupCode,
        IsRegistered,
        FirstName,
        LastName,
        DateOfBirth,
        Gender,
        PhoneNumber,
        EmergencyContact,
        BloodGroup,
        Height,
        Weight,
        AddressLine1,
        AddressLine2,
        City,
        State,
        PostalCode,
        Country,
        CreatedByAdminID,
        CreatedOn
    ) VALUES (
        v_signup_code,
        FALSE,
        TRIM(p_first_name),
        TRIM(p_last_name),
        p_date_of_birth,
        p_gender,
        p_phone_number,
        p_emergency_contact,
        p_blood_group,
        p_height,
        p_weight,
        p_address_line1,
        p_address_line2,
        p_city,
        p_state,
        p_postal_code,
        p_country,
        p_created_by_admin_id,
        NOW()
    )
    RETURNING PatientID INTO v_patient_id;

    -- ================================
    -- RETURN SUCCESS
    -- ================================
    RETURN QUERY
    SELECT
        v_patient_id,
        v_signup_code,
        ('Patient ' || TRIM(p_first_name) || ' ' || TRIM(p_last_name) ||
        ' registered successfully. Signup code: ' || v_signup_code)::TEXT;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$

CREATE OR REPLACE FUNCTION fn_create_case_request(
    -- Assessment details
    p_patient_id        INT,
    p_nurse_employee_id INT,
    p_symptoms          TEXT,
    p_condition         condition_type,
    p_temperature       DECIMAL,
    p_systolic_bp       INT,
    p_diastolic_bp      INT,
    p_pulse_rate        INT,
    p_oxygen_level      DECIMAL,
    p_blood_sugar       DECIMAL,
    p_notes             TEXT,

    -- Case request details
    p_assigned_dept_id  INT,
    p_urgency           case_urgency,
    p_case_summary      TEXT
)
RETURNS TABLE (
    assessment_id   INT,
    case_request_id INT,
    message         TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assessment_id     INT;
    v_case_request_id   INT;
    v_patient_exists    BOOLEAN;
    v_nurse_exists      BOOLEAN;
    v_nurse_type        employee_type;
    v_dept_exists       BOOLEAN;
    v_open_case_exists  BOOLEAN;
    v_patient_name      VARCHAR;
    v_dept_name         VARCHAR;
BEGIN
    -- ================================
    -- VALIDATION 1: Patient exists
    -- ================================
    SELECT EXISTS (
        SELECT 1 FROM Patient
        WHERE PatientID = p_patient_id
    ) INTO v_patient_exists;

    IF NOT v_patient_exists THEN
        RAISE EXCEPTION 'Patient with ID % does not exist', p_patient_id;
    END IF;

    -- Get patient name for message
    SELECT FirstName || ' ' || LastName INTO v_patient_name
    FROM Patient WHERE PatientID = p_patient_id;

    -- ================================
    -- VALIDATION 2: Nurse exists and is active
    -- ================================
    SELECT EXISTS (
        SELECT 1 FROM Employee
        WHERE EmployeeID = p_nurse_employee_id
        AND IsActive = TRUE
    ) INTO v_nurse_exists;

    IF NOT v_nurse_exists THEN
        RAISE EXCEPTION 'Nurse with ID % does not exist or is inactive',
            p_nurse_employee_id;
    END IF;

    -- ================================
    -- VALIDATION 3: Employee must be a Nurse
    -- ================================
    SELECT EmployeeType INTO v_nurse_type
    FROM Employee
    WHERE EmployeeID = p_nurse_employee_id;

    IF v_nurse_type != 'Nurse' THEN
        RAISE EXCEPTION 'Employee ID % is not a Nurse. Only nurses can create case requests',
            p_nurse_employee_id;
    END IF;

    -- ================================
    -- VALIDATION 4: Department exists
    -- ================================
    SELECT EXISTS (
        SELECT 1 FROM Department
        WHERE DepartmentID = p_assigned_dept_id
    ) INTO v_dept_exists;

    IF NOT v_dept_exists THEN
        RAISE EXCEPTION 'Department with ID % does not exist', p_assigned_dept_id;
    END IF;

    -- Get department name for message
    SELECT Name INTO v_dept_name
    FROM Department WHERE DepartmentID = p_assigned_dept_id;

    -- ================================
    -- VALIDATION 5: Patient must not have an existing open case
    -- ================================
    SELECT EXISTS (
        SELECT 1 FROM CaseRequest
        WHERE PatientID = p_patient_id
        AND Status IN ('Open', 'Accepted', 'InProgress')
    ) INTO v_open_case_exists;

    IF v_open_case_exists THEN
        RAISE EXCEPTION 'Patient % already has an active open case. Cannot create a new case until the existing one is resolved or cancelled',
            v_patient_name;
    END IF;

    -- ================================
    -- VALIDATION 6: Symptoms not empty
    -- ================================
    IF TRIM(p_symptoms) = '' OR p_symptoms IS NULL THEN
        RAISE EXCEPTION 'Symptoms cannot be empty';
    END IF;

    -- ================================
    -- VALIDATION 7: Case summary not empty
    -- ================================
    IF TRIM(p_case_summary) = '' OR p_case_summary IS NULL THEN
        RAISE EXCEPTION 'Case summary cannot be empty';
    END IF;

    -- ================================
    -- VALIDATION 8: Vitals range check
    -- ================================
    IF p_temperature IS NOT NULL AND (p_temperature < 30 OR p_temperature > 45) THEN
        RAISE EXCEPTION 'Temperature % is out of valid range (30-45°C)', p_temperature;
    END IF;

    IF p_systolic_bp IS NOT NULL AND (p_systolic_bp < 50 OR p_systolic_bp > 300) THEN
        RAISE EXCEPTION 'Systolic BP % is out of valid range (50-300)', p_systolic_bp;
    END IF;

    IF p_diastolic_bp IS NOT NULL AND (p_diastolic_bp < 30 OR p_diastolic_bp > 200) THEN
        RAISE EXCEPTION 'Diastolic BP % is out of valid range (30-200)', p_diastolic_bp;
    END IF;

    IF p_systolic_bp IS NOT NULL AND p_diastolic_bp IS NOT NULL 
        AND p_diastolic_bp >= p_systolic_bp THEN
        RAISE EXCEPTION 'Diastolic BP (%) must be less than Systolic BP (%)',
            p_diastolic_bp, p_systolic_bp;
    END IF;

    IF p_pulse_rate IS NOT NULL AND (p_pulse_rate < 20 OR p_pulse_rate > 300) THEN
        RAISE EXCEPTION 'Pulse rate % is out of valid range (20-300)', p_pulse_rate;
    END IF;

    IF p_oxygen_level IS NOT NULL AND (p_oxygen_level < 50 OR p_oxygen_level > 100) THEN
        RAISE EXCEPTION 'Oxygen level % is out of valid range (50-100)', p_oxygen_level;
    END IF;

    IF p_blood_sugar IS NOT NULL AND (p_blood_sugar < 20 OR p_blood_sugar > 1000) THEN
        RAISE EXCEPTION 'Blood sugar % is out of valid range (20-1000)', p_blood_sugar;
    END IF;

    -- ================================
    -- INSERT PATIENT ASSESSMENT
    -- ================================
    INSERT INTO PatientAssessment (
        PatientID,
        NurseEmployeeID,
        Symptoms,
        Condition,
        Temperature,
        SystolicBP,
        DiastolicBP,
        PulseRate,
        OxygenLevel,
        BloodSugar,
        Notes,
        AssessedOn
    ) VALUES (
        p_patient_id,
        p_nurse_employee_id,
        TRIM(p_symptoms),
        p_condition,
        p_temperature,
        p_systolic_bp,
        p_diastolic_bp,
        p_pulse_rate,
        p_oxygen_level,
        p_blood_sugar,
        p_notes,
        NOW()
    )
    RETURNING AssessmentID INTO v_assessment_id;

    -- ================================
    -- INSERT CASE REQUEST
    -- Status = 'Open', no doctor assigned yet
    -- ================================
    INSERT INTO CaseRequest (
        PatientID,
        AssessmentID,
        AssignedDeptID,
        DoctorEmployeeID,   -- NULL, doctor not assigned yet
        NurseEmployeeID,
        RoomID,             -- NULL, room assigned after doctor accepts
        CreatedByAdminID,   -- nurse acts as creator here
        CaseSummary,
        Urgency,
        Status,
        IsAdmitted,
        CreatedOn
    ) VALUES (
        p_patient_id,
        v_assessment_id,
        p_assigned_dept_id,
        NULL,
        p_nurse_employee_id,
        NULL,
        p_nurse_employee_id,
        TRIM(p_case_summary),
        p_urgency,
        'Open',
        FALSE,
        NOW()
    )
    RETURNING CaseRequestID INTO v_case_request_id;

    -- ================================
    -- RETURN SUCCESS
    -- ================================
    RETURN QUERY
    SELECT
        v_assessment_id,
        v_case_request_id,
        ('Case request created successfully for patient ' || v_patient_name ||
        ' in ' || v_dept_name || ' department. Waiting for doctor to accept.')::TEXT;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION fn_accept_reject_case(
    p_case_request_id   INT,
    p_doctor_employee_id INT,
    p_action            VARCHAR,  -- 'Accept' or 'Reject'
    p_rejection_reason  TEXT DEFAULT NULL
)
RETURNS TABLE (
    case_request_id INT,
    status          TEXT,
    message         TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_case_exists       BOOLEAN;
    v_case_status       case_status;
    v_doctor_exists     BOOLEAN;
    v_doctor_type       employee_type;
    v_doctor_dept       INT;
    v_case_dept         INT;
    v_is_accepting      BOOLEAN;
    v_patient_name      VARCHAR;
    v_doctor_name       VARCHAR;
BEGIN
    -- ================================
    -- VALIDATION 1: Case exists
    -- ================================
    SELECT EXISTS (
        SELECT 1 FROM CaseRequest
        WHERE CaseRequestID = p_case_request_id
    ) INTO v_case_exists;

    IF NOT v_case_exists THEN
        RAISE EXCEPTION 'Case request with ID % does not exist',
            p_case_request_id;
    END IF;

    -- ================================
    -- VALIDATION 2: Case must be Open
    -- ================================
    SELECT Status INTO v_case_status
    FROM CaseRequest
    WHERE CaseRequestID = p_case_request_id;

    IF v_case_status != 'Open' THEN
        RAISE EXCEPTION 'Case request % is not Open. Current status is %. Only Open cases can be accepted or rejected',
            p_case_request_id, v_case_status;
    END IF;

    -- ================================
    -- VALIDATION 3: Doctor exists and is active
    -- ================================
    SELECT EXISTS (
        SELECT 1 FROM Employee
        WHERE EmployeeID = p_doctor_employee_id
        AND IsActive = TRUE
    ) INTO v_doctor_exists;

    IF NOT v_doctor_exists THEN
        RAISE EXCEPTION 'Doctor with ID % does not exist or is inactive',
            p_doctor_employee_id;
    END IF;

    -- ================================
    -- VALIDATION 4: Employee must be a Doctor
    -- ================================
    SELECT EmployeeType INTO v_doctor_type
    FROM Employee
    WHERE EmployeeID = p_doctor_employee_id;

    IF v_doctor_type != 'Doctor' THEN
        RAISE EXCEPTION 'Employee ID % is not a Doctor. Only doctors can accept or reject cases',
            p_doctor_employee_id;
    END IF;

    -- ================================
    -- VALIDATION 5: Doctor must be accepting cases
    -- ================================
    SELECT IsAcceptingCases INTO v_is_accepting
    FROM DoctorProfile
    WHERE EmployeeID = p_doctor_employee_id;

    IF NOT v_is_accepting THEN
        RAISE EXCEPTION 'Doctor with ID % is currently not accepting new cases',
            p_doctor_employee_id;
    END IF;

    -- ================================
    -- VALIDATION 6: Doctor must belong to same department as case
    -- ================================
    SELECT DepartmentID INTO v_doctor_dept
    FROM Employee
    WHERE EmployeeID = p_doctor_employee_id;

    SELECT AssignedDeptID INTO v_case_dept
    FROM CaseRequest
    WHERE CaseRequestID = p_case_request_id;

    IF v_doctor_dept != v_case_dept THEN
        RAISE EXCEPTION 'Doctor with ID % belongs to a different department than the case. Doctor dept: %, Case dept: %',
            p_doctor_employee_id, v_doctor_dept, v_case_dept;
    END IF;

    -- ================================
    -- VALIDATION 7: Action must be Accept or Reject
    -- ================================
    IF p_action NOT IN ('Accept', 'Reject') THEN
        RAISE EXCEPTION 'Invalid action %. Action must be either Accept or Reject',
            p_action;
    END IF;

    -- ================================
    -- VALIDATION 8: Rejection reason required if rejecting
    -- ================================
    IF p_action = 'Reject' AND (p_rejection_reason IS NULL OR TRIM(p_rejection_reason) = '') THEN
        RAISE EXCEPTION 'Rejection reason is required when rejecting a case';
    END IF;

    -- Get names for message
    SELECT FirstName || ' ' || LastName INTO v_patient_name
    FROM Patient p
    JOIN CaseRequest cr ON p.PatientID = cr.PatientID
    WHERE cr.CaseRequestID = p_case_request_id;

    SELECT FirstName || ' ' || LastName INTO v_doctor_name
    FROM Employee
    WHERE EmployeeID = p_doctor_employee_id;

    -- ================================
    -- ACCEPT CASE
    -- ================================
    IF p_action = 'Accept' THEN
        UPDATE CaseRequest
        SET
            DoctorEmployeeID = p_doctor_employee_id,
            Status           = 'Accepted',
            ModifiedOn       = NOW()
        WHERE CaseRequestID = p_case_request_id;

        RETURN QUERY
        SELECT
            p_case_request_id,
            'Accepted'::TEXT,
            ('Case ' || p_case_request_id || ' accepted by Dr. ' || v_doctor_name ||
            ' for patient ' || v_patient_name || '.')::TEXT;

    -- ================================
    -- REJECT CASE
    -- Reset DoctorEmployeeID to NULL so other doctors can accept
    -- ================================
    ELSIF p_action = 'Reject' THEN
        UPDATE CaseRequest
        SET
            DoctorEmployeeID = NULL,
            Status           = 'Open',  -- back to Open for other doctors
            CaseSummary      = CaseSummary || ' | Rejected by Dr. ' || 
                               v_doctor_name || ': ' || p_rejection_reason,
            ModifiedOn       = NOW()
        WHERE CaseRequestID = p_case_request_id;

        RETURN QUERY
        SELECT
            p_case_request_id,
            'Rejected'::TEXT,
            ('Case ' || p_case_request_id || ' rejected by Dr. ' || v_doctor_name ||
            ' for patient ' || v_patient_name ||
            '. Reason: ' || p_rejection_reason ||
            '. Case is back to Open for other doctors.')::TEXT;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION fn_submit_feedback(
    p_patient_id        INT,
    p_employee_id       INT,
    p_case_request_id   INT,
    p_rating            SMALLINT,
    p_comment           TEXT DEFAULT NULL
)
RETURNS TABLE (
    feedback_patient_id     INT,
    feedback_employee_id    INT,
    feedback_case_id        INT,
    message                 TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_patient_exists    BOOLEAN;
    v_employee_exists   BOOLEAN;
    v_case_exists       BOOLEAN;
    v_case_status       case_status;
    v_patient_owns_case BOOLEAN;
    v_doctor_in_case    BOOLEAN;
    v_already_submitted BOOLEAN;
    v_patient_name      VARCHAR;
    v_employee_name     VARCHAR;
BEGIN
    -- ================================
    -- VALIDATION 1: Patient exists
    -- ================================
    SELECT EXISTS (
        SELECT 1 FROM Patient
        WHERE PatientID = p_patient_id
    ) INTO v_patient_exists;

    IF NOT v_patient_exists THEN
        RAISE EXCEPTION 'Patient with ID % does not exist', p_patient_id;
    END IF;

    -- Get patient name
    SELECT FirstName || ' ' || LastName INTO v_patient_name
    FROM Patient WHERE PatientID = p_patient_id;

    -- ================================
    -- VALIDATION 2: Employee exists and is active
    -- ================================
    SELECT EXISTS (
        SELECT 1 FROM Employee
        WHERE EmployeeID = p_employee_id
        AND IsActive = TRUE
    ) INTO v_employee_exists;

    IF NOT v_employee_exists THEN
        RAISE EXCEPTION 'Employee with ID % does not exist or is inactive',
            p_employee_id;
    END IF;

    -- Get employee name
    SELECT FirstName || ' ' || LastName INTO v_employee_name
    FROM Employee WHERE EmployeeID = p_employee_id;

    -- ================================
    -- VALIDATION 3: Case exists
    -- ================================
    SELECT EXISTS (
        SELECT 1 FROM CaseRequest
        WHERE CaseRequestID = p_case_request_id
    ) INTO v_case_exists;

    IF NOT v_case_exists THEN
        RAISE EXCEPTION 'Case request with ID % does not exist',
            p_case_request_id;
    END IF;

    -- ================================
    -- VALIDATION 4: Case must be Resolved
    -- ================================
    SELECT Status INTO v_case_status
    FROM CaseRequest
    WHERE CaseRequestID = p_case_request_id;

    IF v_case_status != 'Resolved' THEN
        RAISE EXCEPTION 'Feedback can only be submitted for Resolved cases. Current status is %',
            v_case_status;
    END IF;

    -- ================================
    -- VALIDATION 5: Patient must belong to this case
    -- ================================
    SELECT EXISTS (
        SELECT 1 FROM CaseRequest
        WHERE CaseRequestID = p_case_request_id
        AND PatientID = p_patient_id
    ) INTO v_patient_owns_case;

    IF NOT v_patient_owns_case THEN
        RAISE EXCEPTION 'Patient % is not associated with case %',
            v_patient_name, p_case_request_id;
    END IF;

    -- ================================
    -- VALIDATION 6: Employee must be associated with this case
    -- Either as doctor or nurse
    -- ================================
    SELECT EXISTS (
        SELECT 1 FROM CaseRequest
        WHERE CaseRequestID = p_case_request_id
        AND (
            DoctorEmployeeID = p_employee_id
            OR NurseEmployeeID = p_employee_id
        )
    ) INTO v_doctor_in_case;

    IF NOT v_doctor_in_case THEN
        RAISE EXCEPTION 'Employee % is not associated with case %',
            v_employee_name, p_case_request_id;
    END IF;

    -- ================================
    -- VALIDATION 7: Rating must be between 1 and 5
    -- ================================
    IF p_rating IS NULL THEN
        RAISE EXCEPTION 'Rating cannot be null';
    END IF;

    IF p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Rating must be between 1 and 5, got: %', p_rating;
    END IF;

    -- ================================
    -- VALIDATION 8: Feedback already submitted
    -- ================================
    SELECT EXISTS (
        SELECT 1 FROM Feedback
        WHERE PatientID     = p_patient_id
        AND   EmployeeID    = p_employee_id
        AND   CaseRequestID = p_case_request_id
    ) INTO v_already_submitted;

    IF v_already_submitted THEN
        RAISE EXCEPTION 'Feedback already submitted by patient % for employee % in case %',
            v_patient_name, v_employee_name, p_case_request_id;
    END IF;

    -- ================================
    -- INSERT FEEDBACK
    -- ================================
    INSERT INTO Feedback (
        PatientID,
        EmployeeID,
        CaseRequestID,
        Rating,
        Comment,
        CreatedOn
    ) VALUES (
        p_patient_id,
        p_employee_id,
        p_case_request_id,
        p_rating,
        TRIM(p_comment),
        NOW()
    );

    -- ================================
    -- RETURN SUCCESS
    -- ================================
    RETURN QUERY
    SELECT
        p_patient_id,
        p_employee_id,
        p_case_request_id,
        ('Feedback submitted successfully by ' || v_patient_name ||
        ' for ' || v_employee_name ||
        ' with rating ' || p_rating || '/5.')::TEXT;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;