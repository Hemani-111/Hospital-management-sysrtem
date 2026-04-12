-- adding data now;
-- Doctor sees all their assigned cases with patient info and assessment details
-- CREATE VIEW vw_doctor_case_dashboard AS
-- SELECT
--     cr.CaseRequestID,
--     cr.Status                                   AS CaseStatus,
--     cr.Urgency,
--     cr.CaseSummary,
--     cr.IsAdmitted,
--     cr.AdmittedOn,
--     cr.DischargedOn,
--     cr.CreatedOn                                AS CaseCreatedOn,

--     -- Patient info
--     p.PatientID,
--     p.FirstName || ' ' || p.LastName            AS PatientName,
--     p.DateOfBirth,
--     p.Gender,
--     p.BloodGroup,
--     p.PhoneNumber                               AS PatientPhone,

--     -- Doctor info
--     e.EmployeeID                                AS DoctorEmployeeID,
--     e.FirstName || ' ' || e.LastName            AS DoctorName,
--     dp.Specialization,

--     -- Nurse info
--     ne.FirstName || ' ' || ne.LastName          AS NurseName,

--     -- Department
--     d.Name                                      AS Department,

--     -- Room
--     r.RoomNumber,
--     r.Type                                      AS RoomType,

--     -- Assessment
--     pa.Symptoms,
--     pa.Condition,
--     pa.Temperature,
--     pa.SystolicBP,
--     pa.DiastolicBP,
--     pa.PulseRate,
--     pa.OxygenLevel,
--     pa.BloodSugar,
--     pa.AssessedOn

-- FROM CaseRequest cr
-- JOIN Patient          p   ON cr.PatientID        = p.PatientID
-- JOIN Employee         e   ON cr.DoctorEmployeeID = e.EmployeeID
-- JOIN DoctorProfile    dp  ON e.EmployeeID        = dp.EmployeeID
-- JOIN Employee         ne  ON cr.NurseEmployeeID  = ne.EmployeeID
-- JOIN Department       d   ON cr.AssignedDeptID   = d.DepartmentID
-- LEFT JOIN Room        r   ON cr.RoomID           = r.RoomID
-- LEFT JOIN PatientAssessment pa ON cr.AssessmentID = pa.AssessmentID;

-- CREATE VIEW vw_patient_appointments_bills AS
-- SELECT
--     p.PatientID,
--     p.FirstName || ' ' || p.LastName        AS PatientName,

--     ap.AppointmentID,
--     ap.AppointmentDate,
--     ap.StartTime,
--     ap.EndTime,
--     ap.Type                                 AS AppointmentType,
--     ap.Status                               AS AppointmentStatus,

--     e.FirstName || ' ' || e.LastName        AS DoctorName,
--     dp.Specialization,
--     d.Name                                  AS Department,

--     b.BillID,
--     b.TotalAmount,
--     b.Discount,
--     b.InsuranceCovered,
--     b.PaymentStatus,
--     b.PaymentMethod,
--     b.GeneratedOn,
--     b.PaidOn,

--     ins.ProviderName                        AS InsuranceProvider,
--     pi.PolicyNumber,
--     pi.CoveragePercent

-- FROM Patient p
-- LEFT JOIN CaseRequest       cr  ON p.PatientID          = cr.PatientID
-- LEFT JOIN Appointment       ap  ON cr.CaseRequestID     = ap.CaseRequestID
-- LEFT JOIN Employee          e   ON ap.DoctorEmployeeID  = e.EmployeeID
-- LEFT JOIN DoctorProfile     dp  ON e.EmployeeID         = dp.EmployeeID
-- LEFT JOIN Department        d   ON cr.AssignedDeptID    = d.DepartmentID
-- LEFT JOIN Bill              b   ON cr.CaseRequestID     = b.CaseRequestID
-- LEFT JOIN PatientInsurance  pi  ON b.PatientInsuranceID = pi.PatientInsuranceID
-- LEFT JOIN Insurance         ins ON pi.InsuranceID       = ins.InsuranceID
-- WHERE p.PatientID = current_setting('app.current_user_id')::INT;

-- CREATE VIEW vw_patient_medical_history AS
-- SELECT
--     p.PatientID,
--     p.FirstName || ' ' || p.LastName            AS PatientName,
--     p.DateOfBirth,
--     p.Gender,
--     p.BloodGroup,
--     p.Height,
--     p.Weight,

--     cr.CaseRequestID,
--     cr.Status                                   AS CaseStatus,
--     cr.Urgency,
--     cr.CaseSummary,
--     cr.IsAdmitted,
--     cr.AdmittedOn,
--     cr.DischargedOn,
--     cr.CreatedOn                                AS CaseDate,

--     pa.Symptoms,
--     pa.Condition,
--     pa.Temperature,
--     pa.SystolicBP,
--     pa.DiastolicBP,
--     pa.PulseRate,
--     pa.OxygenLevel,
--     pa.BloodSugar,
--     pa.AssessedOn,

--     e.FirstName || ' ' || e.LastName            AS DoctorName,
--     dp.Specialization,
--     d.Name                                      AS Department,

--     r.RoomNumber,
--     r.Type                                      AS RoomType,

--     -- All diseases aggregated into one row per case
--     STRING_AGG(DISTINCT dis.Name, ', ')         AS Diseases,
--     STRING_AGG(DISTINCT dis.ICD10Code, ', ')    AS ICD10Codes,
--     STRING_AGG(
--         DISTINCT dg.Severity::TEXT, ', '
--     )                                           AS Severities,
--     STRING_AGG(
--         DISTINCT dis.Name || ' (' || dg.Severity || ')',
--         ' | '
--     )                                           AS DiagnosisSummary,

--     -- Lab reports aggregated
--     STRING_AGG(
--         DISTINCT lt.TestName || ': ' || lr.TestValue,
--         ' | '
--     )                                           AS LabResults,

--     -- Prescription
--     pr.Medicines,
--     pr.Instructions,
--     pr.PrescribedOn,

--     -- Bill
--     b.TotalAmount,
--     b.Discount,
--     b.InsuranceCovered,
--     b.PaymentStatus,
--     b.PaidOn

-- FROM Patient p
-- LEFT JOIN CaseRequest           cr  ON p.PatientID          = cr.PatientID
-- LEFT JOIN PatientAssessment     pa  ON cr.AssessmentID      = pa.AssessmentID
-- LEFT JOIN Employee              e   ON cr.DoctorEmployeeID  = e.EmployeeID
-- LEFT JOIN DoctorProfile         dp  ON e.EmployeeID         = dp.EmployeeID
-- LEFT JOIN Department            d   ON cr.AssignedDeptID    = d.DepartmentID
-- LEFT JOIN Room                  r   ON cr.RoomID            = r.RoomID
-- LEFT JOIN Diagnosis             dg  ON cr.CaseRequestID     = dg.CaseRequestID
-- LEFT JOIN Disease               dis ON dg.DiseaseID         = dis.DiseaseID
-- LEFT JOIN Prescription          pr  ON cr.CaseRequestID     = pr.CaseRequestID
-- LEFT JOIN LabReport             lr  ON cr.CaseRequestID     = lr.CaseRequestID
-- LEFT JOIN LabTest               lt  ON lr.LabTestID         = lt.LabTestID
-- LEFT JOIN Bill                  b   ON cr.CaseRequestID     = b.CaseRequestID
-- WHERE p.PatientID = current_setting('app.current_user_id')::INT
-- GROUP BY
--     p.PatientID,
--     p.FirstName,
--     p.LastName,
--     p.DateOfBirth,
--     p.Gender,
--     p.BloodGroup,
--     p.Height,
--     p.Weight,
--     cr.CaseRequestID,
--     cr.Status,
--     cr.Urgency,
--     cr.CaseSummary,
--     cr.IsAdmitted,
--     cr.AdmittedOn,
--     cr.DischargedOn,
--     cr.CreatedOn,
--     pa.Symptoms,
--     pa.Condition,
--     pa.Temperature,
--     pa.SystolicBP,
--     pa.DiastolicBP,
--     pa.PulseRate,
--     pa.OxygenLevel,
--     pa.BloodSugar,
--     pa.AssessedOn,
--     e.FirstName,
--     e.LastName,
--     dp.Specialization,
--     d.Name,
--     r.RoomNumber,
--     r.Type,
--     pr.Medicines,
--     pr.Instructions,
--     pr.PrescribedOn,
--     b.TotalAmount,
--     b.Discount,
--     b.InsuranceCovered,
--     b.PaymentStatus,
--     b.PaidOn;


-- CREATE VIEW vw_nurse_billing_summary AS
-- SELECT
--     b.BillID,
--     b.PaymentStatus,
--     b.PaymentMethod,
--     b.GeneratedOn,
--     b.PaidOn,
--     b.ConsultationFee,
--     b.RoomCharges,
--     b.LabCharges,
--     b.MedicineCharges,
--     b.OtherCharges,
--     b.Discount,
--     b.InsuranceCovered,
--     b.TotalAmount,

--     cr.CaseRequestID,
--     cr.Status                               AS CaseStatus,
--     cr.IsAdmitted,

--     p.PatientID,
--     p.FirstName || ' ' || p.LastName        AS PatientName,
--     p.PhoneNumber                           AS PatientPhone,

--     e.FirstName || ' ' || e.LastName        AS DoctorName,
--     dp.Specialization,

--     ne.EmployeeID                           AS NurseEmployeeID,
--     ne.FirstName || ' ' || ne.LastName      AS NurseName,

--     ins.ProviderName                        AS InsuranceProvider,
--     ins.PlanName                            AS InsurancePlan,
--     pi.PolicyNumber,
--     pi.CoveragePercent,
--     pi.CoPay,
--     pi.Status                               AS InsuranceStatus

-- FROM Bill b
-- JOIN CaseRequest        cr  ON b.CaseRequestID          = cr.CaseRequestID
-- JOIN Patient            p   ON cr.PatientID             = p.PatientID
-- LEFT JOIN Employee      e   ON cr.DoctorEmployeeID      = e.EmployeeID
-- LEFT JOIN DoctorProfile dp  ON e.EmployeeID             = dp.EmployeeID
-- LEFT JOIN Employee      ne  ON cr.NurseEmployeeID       = ne.EmployeeID
-- LEFT JOIN PatientInsurance pi   ON b.PatientInsuranceID = pi.PatientInsuranceID
-- LEFT JOIN Insurance     ins ON pi.InsuranceID           = ins.InsuranceID
-- WHERE ne.EmployeeID = current_setting('app.current_user_id')::INT;

-- CREATE VIEW vw_nurse_case_dashboard AS
-- SELECT
--     cr.CaseRequestID,
--     cr.Status                               AS CaseStatus,
--     cr.Urgency,
--     cr.CaseSummary,
--     cr.IsAdmitted,
--     cr.AdmittedOn,
--     cr.DischargedOn,
--     cr.CreatedOn                            AS CaseCreatedOn,

--     p.PatientID,
--     p.FirstName || ' ' || p.LastName        AS PatientName,
--     p.Gender,
--     p.BloodGroup,
--     p.PhoneNumber                           AS PatientPhone,

--     pa.AssessmentID,
--     pa.Symptoms,
--     pa.Condition,
--     pa.Temperature,
--     pa.SystolicBP,
--     pa.DiastolicBP,
--     pa.PulseRate,
--     pa.OxygenLevel,
--     pa.BloodSugar,
--     pa.AssessedOn,

--     e.FirstName || ' ' || e.LastName        AS DoctorName,
--     dp.Specialization,
--     d.Name                                  AS Department,

--     r.RoomNumber,
--     r.Type                                  AS RoomType,

--     ne.EmployeeID                           AS NurseEmployeeID,
--     ne.FirstName || ' ' || ne.LastName      AS NurseName

-- FROM CaseRequest cr
-- JOIN Patient            p   ON cr.PatientID         = p.PatientID
-- LEFT JOIN Employee      ne  ON cr.NurseEmployeeID   = ne.EmployeeID
-- LEFT JOIN Employee      e   ON cr.DoctorEmployeeID  = e.EmployeeID
-- LEFT JOIN DoctorProfile dp  ON e.EmployeeID         = dp.EmployeeID
-- JOIN Department         d   ON cr.AssignedDeptID    = d.DepartmentID
-- LEFT JOIN Room          r   ON cr.RoomID            = r.RoomID
-- LEFT JOIN PatientAssessment pa ON cr.AssessmentID   = pa.AssessmentID
-- WHERE ne.EmployeeID = current_setting('app.current_user_id')::INT;


---adding a new view for open cases in department to doctor to select from 
-- CREATE VIEW vw_open_cases_by_dept AS
-- SELECT
--     cr.CaseRequestID,
--     cr.Status                               AS CaseStatus,
--     cr.Urgency,
--     cr.CaseSummary,
--     cr.CreatedOn                            AS CaseCreatedOn,

--     p.PatientID,
--     p.FirstName || ' ' || p.LastName        AS PatientName,
--     p.DateOfBirth,
--     p.Gender,
--     p.BloodGroup,
--     p.PhoneNumber                           AS PatientPhone,

--     pa.Symptoms,
--     pa.Condition,
--     pa.Temperature,
--     pa.SystolicBP,
--     pa.DiastolicBP,
--     pa.PulseRate,
--     pa.OxygenLevel,
--     pa.BloodSugar,
--     pa.AssessedOn,

--     ne.FirstName || ' ' || ne.LastName      AS NurseName,

--     d.DepartmentID,
--     d.Name                                  AS Department

-- FROM CaseRequest cr
-- JOIN Patient            p   ON cr.PatientID         = p.PatientID
-- JOIN Department         d   ON cr.AssignedDeptID    = d.DepartmentID
-- JOIN Employee           ne  ON cr.NurseEmployeeID   = ne.EmployeeID
-- LEFT JOIN PatientAssessment pa ON cr.AssessmentID   = pa.AssessmentID
-- WHERE cr.Status = 'Open'
-- AND cr.DoctorEmployeeID IS NULL
-- AND d.DepartmentID = (
--     -- Get the department of the currently logged in doctor
--     SELECT DepartmentID FROM Employee
--     WHERE EmployeeID = current_setting('app.current_user_id')::INT
-- );