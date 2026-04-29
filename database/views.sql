-- ============================================================
-- HMS DATABASE VIEWS (PostgreSQL Standard)
-- ============================================================

-- Doctor sees all their assigned cases with patient info and assessment details
CREATE OR REPLACE VIEW vw_doctor_case_dashboard AS
SELECT
    cr.CaseRequestID,
    cr.Status                                   AS CaseStatus,
    cr.Urgency,
    cr.CaseSummary,
    cr.IsAdmitted,
    cr.AdmittedOn,
    cr.DischargedOn,
    cr.CreatedOn                                AS CaseCreatedOn,

    -- Patient info
    p.PatientID,
    p.FirstName || ' ' || p.LastName            AS PatientName,
    p.DateOfBirth,
    p.Gender,
    p.BloodGroup,
    p.PhoneNumber                               AS PatientPhone,

    -- Doctor info
    e.EmployeeID                                AS DoctorEmployeeID,
    e.FirstName || ' ' || e.LastName            AS DoctorName,
    dp.Specialization,

    -- Nurse info
    ne.FirstName || ' ' || ne.LastName          AS NurseName,

    -- Department
    d.Name                                      AS Department,

    -- Room
    r.RoomNumber,
    r.Type                                      AS RoomType,

    -- Assessment
    pa.Symptoms,
    pa.Condition,
    pa.Temperature,
    pa.SystolicBP,
    pa.DiastolicBP,
    pa.PulseRate,
    pa.OxygenLevel,
    pa.BloodSugar,
    pa.AssessedOn

FROM CaseRequest cr
JOIN Patient          p   ON cr.PatientID        = p.PatientID
JOIN Employee         e   ON cr.DoctorEmployeeID = e.EmployeeID
JOIN DoctorProfile    dp  ON e.EmployeeID        = dp.EmployeeID
LEFT JOIN Employee    ne  ON cr.NurseEmployeeID  = ne.EmployeeID
JOIN Department       d   ON cr.AssignedDeptID   = d.DepartmentID
LEFT JOIN Room        r   ON cr.RoomID           = r.RoomID
LEFT JOIN PatientAssessment pa ON cr.AssessmentID = pa.AssessmentID;


-- Patient appointments and bills summary
CREATE OR REPLACE VIEW vw_patient_appointments_bills AS
SELECT
    p.PatientID,
    p.FirstName || ' ' || p.LastName        AS PatientName,

    ap.AppointmentID,
    ap.AppointmentDate,
    ap.StartTime,
    ap.EndTime,
    ap.Type                                 AS AppointmentType,
    ap.Status                               AS AppointmentStatus,

    e.FirstName || ' ' || e.LastName        AS DoctorName,
    dp.Specialization,
    d.Name                                  AS Department,

    b.BillID,
    b.TotalAmount,
    b.Discount,
    b.InsuranceCovered,
    b.PaymentStatus,
    b.PaymentMethod,
    b.GeneratedOn,
    b.PaidOn,

    ins.ProviderName                        AS InsuranceProvider,
    pi.PolicyNumber,
    pi.CoveragePercent

FROM Patient p
LEFT JOIN CaseRequest       cr  ON p.PatientID          = cr.PatientID
LEFT JOIN Appointment       ap  ON cr.CaseRequestID     = ap.CaseRequestID
LEFT JOIN Employee          e   ON ap.DoctorEmployeeID  = e.EmployeeID
LEFT JOIN DoctorProfile     dp  ON e.EmployeeID         = dp.EmployeeID
LEFT JOIN Department        d   ON cr.AssignedDeptID    = d.DepartmentID
LEFT JOIN Bill              b   ON cr.CaseRequestID     = b.CaseRequestID
LEFT JOIN PatientInsurance  pi  ON b.PatientInsuranceID = pi.PatientInsuranceID
LEFT JOIN Insurance         ins ON pi.InsuranceID       = ins.InsuranceID;


-- Comprehensive patient medical history
CREATE OR REPLACE VIEW vw_patient_medical_history AS
SELECT
    p.PatientID,
    p.FirstName || ' ' || p.LastName            AS PatientName,
    p.DateOfBirth,
    p.Gender,
    p.BloodGroup,
    p.Height,
    p.Weight,

    cr.CaseRequestID,
    cr.Status                                   AS CaseStatus,
    cr.Urgency,
    cr.CaseSummary,
    cr.IsAdmitted,
    cr.AdmittedOn,
    cr.DischargedOn,
    cr.CreatedOn                                AS CaseDate,

    pa.Symptoms,
    pa.Condition,
    pa.Temperature,
    pa.SystolicBP,
    pa.DiastolicBP,
    pa.PulseRate,
    pa.OxygenLevel,
    pa.BloodSugar,
    pa.AssessedOn,

    e.FirstName || ' ' || e.LastName            AS DoctorName,
    dp.Specialization,
    d.Name                                      AS Department,

    r.RoomNumber,
    r.Type                                      AS RoomType,

    -- All diseases aggregated
    STRING_AGG(DISTINCT dis.Name, ', ')         AS Diseases,
    STRING_AGG(DISTINCT dis.ICD10Code, ', ')    AS ICD10Codes,

    -- Prescription
    pr.Medicines,
    pr.Instructions,
    pr.PrescribedOn,

    -- Bill
    b.TotalAmount,
    b.PaymentStatus

FROM Patient p
LEFT JOIN CaseRequest           cr  ON p.PatientID          = cr.PatientID
LEFT JOIN PatientAssessment     pa  ON cr.AssessmentID      = pa.AssessmentID
LEFT JOIN Employee              e   ON cr.DoctorEmployeeID  = e.EmployeeID
LEFT JOIN DoctorProfile         dp  ON e.EmployeeID         = dp.EmployeeID
LEFT JOIN Department            d   ON cr.AssignedDeptID    = d.DepartmentID
LEFT JOIN Room                  r   ON cr.RoomID            = r.RoomID
LEFT JOIN Diagnosis             dg  ON cr.CaseRequestID     = dg.CaseRequestID
LEFT JOIN Disease               dis ON dg.DiseaseID         = dis.DiseaseID
LEFT JOIN Prescription          pr  ON cr.CaseRequestID     = pr.CaseRequestID
LEFT JOIN Bill                  b   ON cr.CaseRequestID     = b.CaseRequestID
GROUP BY
    p.PatientID, p.FirstName, p.LastName, p.DateOfBirth, p.Gender, p.BloodGroup, p.Height, p.Weight,
    cr.CaseRequestID, cr.Status, cr.Urgency, cr.CaseSummary, cr.IsAdmitted, cr.AdmittedOn, cr.DischargedOn, cr.CreatedOn,
    pa.Symptoms, pa.Condition, pa.Temperature, pa.SystolicBP, pa.DiastolicBP, pa.PulseRate, pa.OxygenLevel, pa.BloodSugar, pa.AssessedOn,
    e.FirstName, e.LastName, dp.Specialization, d.Name, r.RoomNumber, r.Type,
    pr.Medicines, pr.Instructions, pr.PrescribedOn, b.TotalAmount, b.PaymentStatus;


-- Global open cases view for triage
CREATE OR REPLACE VIEW vw_open_cases_by_dept AS
SELECT
    cr.CaseRequestID,
    cr.Status                               AS CaseStatus,
    cr.Urgency,
    cr.CaseSummary,
    cr.CreatedOn                            AS CaseCreatedOn,

    p.PatientID,
    p.FirstName || ' ' || p.LastName        AS PatientName,
    p.DateOfBirth,
    p.Gender,
    p.BloodGroup,
    p.PhoneNumber                           AS PatientPhone,

    pa.Symptoms,
    pa.Condition,
    pa.Temperature,
    pa.SystolicBP,
    pa.DiastolicBP,
    pa.PulseRate,
    pa.OxygenLevel,
    pa.BloodSugar,
    pa.AssessedOn,

    ne.FirstName || ' ' || ne.LastName      AS NurseName,

    d.DepartmentID,
    d.Name                                  AS Department

FROM CaseRequest cr
JOIN Patient            p   ON cr.PatientID         = p.PatientID
JOIN Department         d   ON cr.AssignedDeptID    = d.DepartmentID
JOIN Employee           ne  ON cr.NurseEmployeeID   = ne.EmployeeID
LEFT JOIN PatientAssessment pa ON cr.AssessmentID   = pa.AssessmentID
WHERE cr.Status = 'Open' AND cr.DoctorEmployeeID IS NULL;


-- ============================================================
-- NURSE: Assessment dashboard with risk indicators
-- ============================================================
CREATE OR REPLACE VIEW vw_nurse_assessment_dashboard AS
SELECT
    pa.AssessmentID,
    pa.PatientID,
    p.FirstName || ' ' || p.LastName    AS PatientName,
    pa.NurseEmployeeID,
    e.FirstName || ' ' || e.LastName    AS NurseName,
    pa.Symptoms,
    pa.Condition,
    pa.Temperature,
    pa.SystolicBP,
    pa.DiastolicBP,
    pa.PulseRate,
    pa.OxygenLevel,
    pa.BloodSugar,
    pa.Notes,
    pa.AssessedOn,
    CASE
        WHEN pa.Condition = 'Critical'  THEN 'HIGH RISK'
        WHEN pa.OxygenLevel < 90        THEN 'LOW OXYGEN'
        WHEN pa.SystolicBP  > 160       THEN 'HIGH BP'
        ELSE 'STABLE'
    END AS RiskStatus
FROM PatientAssessment pa
JOIN Patient  p ON pa.PatientID        = p.PatientID
JOIN Employee e ON pa.NurseEmployeeID  = e.EmployeeID;


-- ============================================================
-- NURSE: Profile (nurses only)
-- ============================================================
CREATE OR REPLACE VIEW vw_nurse_profile AS
SELECT
    e.EmployeeID,
    e.EmployeeNumber,
    e.FirstName,
    e.LastName,
    e.DateOfBirth,
    e.Gender,
    e.PhoneNumber,
    e.AddressLine1,
    e.AddressLine2,
    e.City,
    e.State,
    e.PostalCode,
    e.Country,
    d.Name      AS Department,
    e.ShiftType,
    e.JoiningDate,
    e.ProfilePicture,
    e.IsActive,
    e.CreatedOn
FROM Employee e
JOIN Department d ON e.DepartmentID = d.DepartmentID
WHERE e.EmployeeType = 'Nurse';


-- ============================================================
-- DOCTOR: Diagnosis details per case
-- ============================================================
CREATE OR REPLACE VIEW vw_doctor_diagnosis AS
SELECT
    cr.CaseRequestID,
    p.PatientID,
    p.FirstName || ' ' || p.LastName    AS PatientName,
    e.EmployeeID                         AS DoctorEmployeeID,
    e.FirstName || ' ' || e.LastName    AS DoctorName,
    dp.Specialization,
    cr.Status                            AS CaseStatus,
    cr.Urgency,
    cr.CaseSummary,
    d.DiseaseID,
    dis.Name                             AS DiseaseName,
    dis.ICD10Code,
    d.Severity,
    d.Notes                              AS DiagnosisNotes,
    d.DiagnosedOn
FROM CaseRequest cr
JOIN Patient        p   ON cr.PatientID         = p.PatientID
JOIN Employee       e   ON cr.DoctorEmployeeID  = e.EmployeeID
JOIN DoctorProfile  dp  ON e.EmployeeID         = dp.EmployeeID
LEFT JOIN Diagnosis d   ON cr.CaseRequestID     = d.CaseRequestID
LEFT JOIN Disease   dis ON d.DiseaseID          = dis.DiseaseID;


-- ============================================================
-- DOCTOR: Prescription details per case
-- ============================================================
CREATE OR REPLACE VIEW vw_doctor_prescription AS
SELECT
    cr.CaseRequestID,
    p.PatientID,
    p.FirstName || ' ' || p.LastName    AS PatientName,
    e.EmployeeID                         AS DoctorEmployeeID,
    e.FirstName || ' ' || e.LastName    AS DoctorName,
    dp.Specialization,
    cr.Status                            AS CaseStatus,
    cr.Urgency,
    cr.CaseSummary,
    pr.PrescriptionID,
    pr.Medicines,
    pr.Instructions,
    pr.PrescribedOn
FROM CaseRequest cr
JOIN Patient        p   ON cr.PatientID         = p.PatientID
JOIN Employee       e   ON cr.DoctorEmployeeID  = e.EmployeeID
JOIN DoctorProfile  dp  ON e.EmployeeID         = dp.EmployeeID
LEFT JOIN Prescription pr ON cr.CaseRequestID   = pr.CaseRequestID;


-- ============================================================
-- DOCTOR: Lab reports for their cases
-- ============================================================
CREATE OR REPLACE VIEW vw_doctor_lab_reports AS
SELECT
    lr.ReportID,
    lr.CaseRequestID,
    p.PatientID,
    p.FirstName || ' ' || p.LastName    AS PatientName,
    p.BloodGroup,
    cr.Status                            AS CaseStatus,
    cr.Urgency,
    cr.CaseSummary,
    lt.LabTestID,
    lt.TestName,
    lt.TestCode,
    lt.NormalRange,
    lt.Unit,
    lt.Price,
    lr.TestValue,
    lr.Status                            AS LabStatus,
    lr.OrderedOn,
    lr.ResultedOn,
    lr.IsBilled,
    CASE
        WHEN lr.Status = 'Ordered'     THEN 'Pending'
        WHEN lr.Status = 'Processing'  THEN 'In Progress'
        WHEN lr.Status = 'Resulted'    THEN 'Completed'
    END                                  AS StatusLabel,
    CASE WHEN lr.ResultedOn IS NULL THEN TRUE ELSE FALSE END AS IsPending,
    oe.FirstName || ' ' || oe.LastName  AS OrderedBy,
    pe.FirstName || ' ' || pe.LastName  AS PerformedBy,
    cr.DoctorEmployeeID
FROM LabReport lr
JOIN Patient      p   ON lr.PatientID      = p.PatientID
JOIN CaseRequest  cr  ON lr.CaseRequestID  = cr.CaseRequestID
JOIN LabTest      lt  ON lr.LabTestID      = lt.LabTestID
JOIN Employee     oe  ON lr.OrderedByID    = oe.EmployeeID
LEFT JOIN Employee pe ON lr.PerformedByID  = pe.EmployeeID;


-- ============================================================
-- DOCTOR: Full profile
-- ============================================================
CREATE OR REPLACE VIEW vw_doctor_profile AS
SELECT
    e.EmployeeID,
    e.FirstName,
    e.LastName,
    dp.Specialization,
    dp.LicenseNumber,
    dp.ConsultationFee
FROM Employee e
JOIN DoctorProfile dp ON e.EmployeeID = dp.EmployeeID;


-- ============================================================
-- PATIENT: Lab reports (completed results only)
-- ============================================================
CREATE OR REPLACE VIEW vw_patient_lab_report AS
SELECT
    lr.ReportID,
    lr.Status                           AS LabStatus,
    lr.OrderedOn,
    lr.ResultedOn,
    lr.TestValue,
    lt.TestName,
    lt.NormalRange,
    lt.Unit,
    lt.Description,
    cr.CaseRequestID,
    oe.FirstName || ' ' || oe.LastName AS OrderedByDoctor,
    dp.Specialization                   AS DoctorSpecialization,
    d.Name                              AS Department
FROM LabReport lr
JOIN LabTest         lt  ON lr.LabTestID      = lt.LabTestID
JOIN CaseRequest     cr  ON lr.CaseRequestID  = cr.CaseRequestID
JOIN Patient         p   ON cr.PatientID      = p.PatientID
JOIN Employee        oe  ON lr.OrderedByID    = oe.EmployeeID
LEFT JOIN DoctorProfile dp ON oe.EmployeeID  = dp.EmployeeID
LEFT JOIN Department d   ON lt.DepartmentID  = d.DepartmentID
WHERE lr.Status = 'Resulted';


-- ============================================================
-- PATIENT: Assessment history with case linkage
-- ============================================================
CREATE OR REPLACE VIEW vw_patient_assessment AS
SELECT
    pa.AssessmentID,
    pa.AssessedOn,
    pa.Symptoms,
    pa.Condition,
    pa.Notes,
    pa.Temperature,
    pa.SystolicBP,
    pa.DiastolicBP,
    pa.PulseRate,
    pa.OxygenLevel,
    pa.BloodSugar,
    ne.FirstName || ' ' || ne.LastName AS AssessedByNurse,
    d.Name                              AS Department,
    cr.CaseRequestID,
    cr.Status                           AS CaseStatus,
    cr.Urgency,
    p.PatientID,
    p.FirstName || ' ' || p.LastName   AS PatientName
FROM PatientAssessment pa
JOIN Patient        p   ON pa.PatientID        = p.PatientID
JOIN Employee       ne  ON pa.NurseEmployeeID  = ne.EmployeeID
JOIN Department     d   ON ne.DepartmentID     = d.DepartmentID
LEFT JOIN CaseRequest cr ON cr.AssessmentID    = pa.AssessmentID;


-- ============================================================
-- PATIENT: Insurance details
-- ============================================================
CREATE OR REPLACE VIEW vw_patient_insurance AS
SELECT
    pi.PatientInsuranceID,
    pi.PolicyNumber,
    pi.CoveragePercent,
    pi.CoPay,
    pi.ValidFrom,
    pi.ValidTo,
    pi.Status                           AS InsuranceStatus,
    pi.CreatedOn                        AS EnrolledOn,
    ins.ProviderName,
    ins.PlanName,
    ins.PlanType,
    ins.ContactNumber                   AS ProviderContact,
    ins.Website                         AS ProviderWebsite,
    p.PatientID,
    p.FirstName || ' ' || p.LastName   AS PatientName,
    CASE
        WHEN pi.ValidTo >= CURRENT_DATE AND pi.Status = 'Active' THEN TRUE
        ELSE FALSE
    END                                 AS IsCurrentlyValid
FROM PatientInsurance pi
JOIN Insurance  ins ON pi.InsuranceID = ins.InsuranceID
JOIN Patient    p   ON pi.PatientID   = p.PatientID;


-- ============================================================
-- PATIENT: Prescription history
-- ============================================================
CREATE OR REPLACE VIEW vw_patient_prescription AS
SELECT
    pr.PrescriptionID,
    pr.PrescribedOn,
    pr.Instructions,
    pr.Medicines,
    cr.CaseRequestID,
    cr.Status                           AS CaseStatus,
    e.FirstName || ' ' || e.LastName   AS PrescribedByDoctor,
    dp.Specialization                   AS DoctorSpecialization,
    d.Name                              AS Department,
    p.PatientID,
    p.FirstName || ' ' || p.LastName   AS PatientName,
    p.BloodGroup
FROM Prescription pr
JOIN CaseRequest        cr  ON pr.CaseRequestID    = cr.CaseRequestID
JOIN Patient            p   ON cr.PatientID        = p.PatientID
JOIN Employee           e   ON cr.DoctorEmployeeID = e.EmployeeID
LEFT JOIN DoctorProfile dp  ON e.EmployeeID        = dp.EmployeeID
LEFT JOIN Department    d   ON cr.AssignedDeptID   = d.DepartmentID;