-- ============================================================
-- HMS FULL DEMO SEED DATA (LOCAL PostgreSQL VERSION)
-- Run in pgAdmin → Query Tool for your hms_db database
-- Default Password for ALL accounts: password123
-- ============================================================

-- 0. CLEANUP (Removes old data to ensure IDs start fresh)
TRUNCATE users, Department, Employee, Patient, Room, DoctorProfile, 
         CaseRequest, Appointment, PatientAssessment, Diagnosis, 
         Prescription, LabTest, LabReport, Bill, Feedback, Insurance, 
         PatientInsurance, Disease RESTART IDENTITY CASCADE;

-- 1. USERS (Local Auth Table)
-- Password hash below = bcrypt hash of 'password123'
-- All demo accounts share this password
INSERT INTO users (UserID, Email, PasswordHash, Role, IsActive) VALUES
(1,  'admin1@hospital.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin',   TRUE),
(2,  'admin2@hospital.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin',   TRUE),
(3,  'dr.rajesh@hospital.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor',  TRUE),
(4,  'dr.priya@hospital.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor',  TRUE),
(5,  'dr.arjun@hospital.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor',  TRUE),
(6,  'dr.meena@hospital.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor',  TRUE),
(7,  'dr.suresh@hospital.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor',  TRUE),
(8,  'nurse.kavya@hospital.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'nurse',   TRUE),
(9,  'nurse.anjali@hospital.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','nurse',   TRUE),
(10, 'nurse.deepa@hospital.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','nurse',   TRUE),
(11, 'patient.aarav@gmail.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','patient', TRUE),
(12, 'patient.sneha@gmail.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','patient', TRUE),
(13, 'patient.ravi@gmail.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','patient', TRUE),
(14, 'patient.lakshmi@gmail.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','patient', TRUE),
(15, 'patient.kiran@gmail.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','patient', TRUE);

-- 2. DEPARTMENTS
INSERT INTO Department (DepartmentID, Name, Description) VALUES
(1, 'Cardiology',        'Heart and cardiovascular system'),
(2, 'Neurology',         'Brain and nervous system'),
(3, 'Orthopedics',       'Bones, joints and muscles'),
(4, 'General Medicine',  'General health and internal medicine'),
(5, 'Pediatrics',        'Medical care for children'),
(6, 'Dermatology',       'Skin, hair and nail conditions'),
(7, 'Pathology',         'Lab testing and disease diagnosis'),
(8, 'Emergency',         'Urgent and emergency care');

-- 3. ROOMS
INSERT INTO Room (RoomNumber, Type, DepartmentID, IsOccupied, PricePerNight) VALUES
('101', 'General',   1, FALSE, 1500.00), ('102', 'Private',   1, TRUE,  4000.00), ('103', 'ICU', 1, TRUE, 9000.00),
('201', 'General',   2, FALSE, 1500.00), ('202', 'Private',   2, FALSE, 4000.00), ('203', 'ICU', 2, TRUE, 9000.00),
('301', 'General',   3, FALSE, 1500.00), ('302', 'Private',   3, TRUE,  4000.00),
('401', 'General',   4, FALSE, 1500.00), ('402', 'Private',   4, FALSE, 4000.00),
('501', 'General',   5, FALSE, 1500.00), ('601', 'General',   6, FALSE, 1500.00),
('801', 'Emergency', 8, TRUE,  6000.00), ('802', 'Emergency', 8, FALSE, 6000.00);

-- 4. EMPLOYEES
INSERT INTO Employee (EmployeeID, UserID, EmployeeNumber, FirstName, LastName, Gender, PhoneNumber, DepartmentID, EmployeeType, ShiftType, JoiningDate) VALUES
(1, 1,  'EMP001', 'Ramesh',  'Kumar',    'Male',   '9876501001', 4, 'Admin',  'Morning', '2020-01-15'),
(2, 2,  'EMP002', 'Sunita',  'Nair',     'Female', '9876501002', 4, 'Admin',  'Morning', '2020-02-20'),
(3, 3,  'EMP003', 'Rajesh',  'Menon',    'Male',   '9876501003', 1, 'Doctor', 'Morning', '2018-06-01'),
(4, 4,  'EMP004', 'Priya',   'Sharma',   'Female', '9876501004', 2, 'Doctor', 'Morning', '2019-03-15'),
(5, 5,  'EMP005', 'Arjun',   'Pillai',   'Male',   '9876501005', 3, 'Doctor', 'Evening', '2019-08-10'),
(6, 6,  'EMP006', 'Meena',   'Krishnan', 'Female', '9876501006', 4, 'Doctor', 'Morning', '2020-01-05'),
(7, 7,  'EMP007', 'Suresh',  'Babu',     'Male',   '9876501007', 5, 'Doctor', 'Morning', '2017-11-20'),
(8, 8,  'EMP008', 'Kavya',   'Rajan',    'Female', '9876501008', 1, 'Nurse',  'Morning', '2021-04-01'),
(9, 9,  'EMP009', 'Anjali',  'Thomas',   'Female', '9876501009', 2, 'Nurse',  'Evening', '2021-07-15'),
(10,10, 'EMP010', 'Deepa',   'Varghese', 'Female', '9876501010', 4, 'Nurse',  'Night',   '2020-09-10');

-- 5. DOCTOR PROFILES
INSERT INTO DoctorProfile (EmployeeID, Specialization, LicenseNumber, Qualification, ExperienceYears, ConsultationFee) VALUES
(3, 'Cardiology',  'KL-MCI-2018-01', 'MD, DM Cardiology',  12, 800.00),
(4, 'Neurology',   'KL-MCI-2019-02', 'MD, DM Neurology',   10, 700.00),
(5, 'Orthopedics', 'KL-MCI-2019-03', 'MS Orthopedics',     11, 750.00),
(6, 'Medicine',    'KL-MCI-2020-04', 'MD General Medicine', 9, 500.00),
(7, 'Pediatrics',  'KL-MCI-2017-05', 'MD Pediatrics',      13, 600.00);

-- 6. PATIENTS
INSERT INTO Patient (PatientID, SignupCode, IsRegistered, UserID, FirstName, LastName, Gender, PhoneNumber, City, CreatedByAdminID) VALUES
(1, 'PAT202401', TRUE, 11, 'Aarav',   'Shah',      'Male',   '9845001001', 'Kochi',      1),
(2, 'PAT202402', TRUE, 12, 'Sneha',   'Pillai',    'Female', '9845001002', 'Ernakulam',  1),
(3, 'PAT202403', TRUE, 13, 'Ravi',    'Nambiar',   'Male',   '9845001003', 'Thrissur',   1),
(4, 'PAT202404', TRUE, 14, 'Lakshmi', 'Devi',      'Female', '9845001004', 'Kozhikode',  2),
(5, 'PAT202405', TRUE, 15, 'Kiran',   'Raj',       'Male',   '9845001005', 'Kollam',     2);

-- 7. DISEASE
INSERT INTO Disease (DiseaseID, Name, ICD10Code, RelevantDeptID) VALUES
(1,  'Hypertension',               'I10',   1),
(2,  'Coronary Artery Disease',    'I25.1', 1),
(3,  'Migraine',                   'G43.9', 2),
(4,  'Epilepsy',                   'G40.9', 2),
(5,  'Osteoarthritis',             'M19.9', 3),
(6,  'Lumbar Disc Herniation',     'M51.1', 3),
(7,  'Type 2 Diabetes Mellitus',   'E11.9', 4),
(8,  'Viral Fever',                'A90',   4),
(9,  'Pneumonia',                  'J18.9', 4),
(10, 'Acute Bronchitis',           'J20.9', 4),
(11, 'Chickenpox',                 'B01.9', 5),
(12, 'Acute Otitis Media',         'H66.9', 5),
(13, 'Psoriasis',                  'L40.9', 6),
(14, 'Atopic Dermatitis',          'L20.9', 6);

-- 8. LAB TEST
INSERT INTO LabTest (LabTestID, TestName, TestCode, Description, NormalRange, Unit, Price, DepartmentID) VALUES
(1,  'Complete Blood Count',        'CBC001', 'Counts all blood cell types',            'Varies by component',  'cells/uL',  350.00, 7),
(2,  'Blood Glucose Fasting',       'BGF001', 'Measures fasting blood sugar level',     '70-100',               'mg/dL',     120.00, 7),
(3,  'HbA1c',                       'HBA001', 'Average blood sugar over 3 months',      'Below 5.7%',           '%',         450.00, 7),
(4,  'Lipid Profile',               'LIP001', 'Cholesterol and triglycerides panel',    'Varies by component',  'mg/dL',     500.00, 7),
(5,  'ECG',                         'ECG001', 'Records electrical activity of heart',   'Normal sinus rhythm',  'mV',        200.00, 1),
(6,  'Chest X-Ray',                 'CXR001', 'Imaging of chest and lungs',             'Clear fields',         'N/A',       400.00, 4),
(7,  'Sputum Culture',              'SPC001', 'Identifies bacteria in sputum',          'No growth',            'N/A',       300.00, 7),
(8,  'Urine Routine',               'URN001', 'Basic urinalysis',                       'Normal values',        'N/A',       100.00, 7),
(9,  'Liver Function Test',         'LFT001', 'Tests liver enzyme levels',              'Varies by component',  'U/L',       600.00, 7),
(10, 'Renal Function Test',         'RFT001', 'Measures kidney function markers',       'Varies by component',  'mg/dL',     550.00, 7),
(11, 'EEG',                         'EEG001', 'Records brain electrical activity',      'Normal wave pattern',  'mV',        800.00, 2),
(12, 'MRI Brain',                   'MRB001', 'Detailed imaging of brain structures',   'No abnormality',       'N/A',      2500.00, 2),
(13, 'Knee X-Ray',                  'KXR001', 'Imaging of knee joint',                  'No abnormality',       'N/A',       350.00, 3),
(14, 'Thyroid Function Test',       'TFT001', 'Measures thyroid hormone levels',        'Varies by component',  'mIU/L',     500.00, 7),
(15, 'Vitamin D Test',              'VTD001', 'Measures Vitamin D levels in blood',     '20-50',                'ng/mL',     700.00, 7),
(16, 'C-Reactive Protein',          'CRP001', 'Measures inflammation in body',          'Less than 1.0',        'mg/L',      350.00, 7),
(17, 'Echocardiogram',              'ECH001', 'Ultrasound imaging of heart',            'Normal cardiac function','N/A',     1500.00, 1),
(18, 'Lumbar MRI',                  'LMR001', 'Detailed imaging of lumbar spine',       'No abnormality',       'N/A',      2500.00, 3),
(19, 'Skin Biopsy',                 'SKB001', 'Tissue sample from skin for analysis',   'No abnormal cells',    'N/A',       800.00, 6),
(20, 'Blood Culture',               'BLC001', 'Detects bacteria or fungi in blood',     'No growth',            'N/A',       450.00, 7);

-- 9. INSURANCE
INSERT INTO Insurance (InsuranceID, ProviderName, PlanName, PlanType, MaxCoverageAmount, ContactNumber, Website) VALUES
(1, 'Star Health',          'Comprehensive Care',   'Family Floater', 500000.00, '1800-425-2255', 'www.starhealth.in'),
(2, 'HDFC Ergo',            'My Health Suraksha',   'Individual',     300000.00, '1800-266-0700', 'www.hdfcergo.com'),
(3, 'New India Assurance',  'Mediclaim 2012',       'Individual',     200000.00, '1800-209-1415', 'www.newindia.co.in'),
(4, 'Bajaj Allianz',        'Health Guard',         'Family Floater', 400000.00, '1800-209-5858', 'www.bajajallianz.com'),
(5, 'ICICI Lombard',        'Complete Health',      'Individual',     600000.00, '1800-2666',     'www.icicilombard.com');

-- 10. ASSESSMENTS
INSERT INTO PatientAssessment (AssessmentID, PatientID, NurseEmployeeID, Symptoms, Condition) VALUES
(1, 1, 8, 'Chest pain, shortness of breath', 'Moderate'),
(2, 2, 9, 'Severe headache, nausea',          'Stable');

-- 11. CASE REQUESTS
INSERT INTO CaseRequest (CaseRequestID, PatientID, AssessmentID, AssignedDeptID, DoctorEmployeeID, NurseEmployeeID, CaseSummary, CreatedByAdminID, Urgency, Status) VALUES
(1, 1, 1, 1, 3, 8, 'Patient presenting with acute chest pain and shortness of breath.', 1, 'Urgent',  'Resolved'),
(2, 2, 2, 2, 4, 9, 'Chronic severe headache with nausea, query neurological assessment.', 1, 'Routine', 'Resolved');

-- 12. APPOINTMENTS
INSERT INTO Appointment (CaseRequestID, PatientID, DoctorEmployeeID, CreatedByEmpID, AppointmentDate, StartTime, EndTime, Type, Status) VALUES
(1, 1, 3, 1, CURRENT_DATE, '10:00:00', '10:30:00', 'Inpatient',  'Completed'),
(2, 2, 4, 1, CURRENT_DATE, '11:00:00', '11:30:00', 'Outpatient', 'Completed');

-- 13. RESET SEQUENCES so new inserts auto-increment correctly
SELECT setval(pg_get_serial_sequence('users',             'userid'),           (SELECT MAX(UserID)          FROM users));
SELECT setval(pg_get_serial_sequence('department',        'departmentid'),     (SELECT MAX(DepartmentID)    FROM Department));
SELECT setval(pg_get_serial_sequence('employee',          'employeeid'),       (SELECT MAX(EmployeeID)      FROM Employee));
SELECT setval(pg_get_serial_sequence('patient',           'patientid'),        (SELECT MAX(PatientID)       FROM Patient));
SELECT setval(pg_get_serial_sequence('disease',           'diseaseid'),        (SELECT MAX(DiseaseID)       FROM Disease));
SELECT setval(pg_get_serial_sequence('labtest',           'labtestid'),        (SELECT MAX(LabTestID)       FROM LabTest));
SELECT setval(pg_get_serial_sequence('insurance',         'insuranceid'),      (SELECT MAX(InsuranceID)     FROM Insurance));
SELECT setval(pg_get_serial_sequence('caserequest',       'caserequestid'),    (SELECT MAX(CaseRequestID)   FROM CaseRequest));
SELECT setval(pg_get_serial_sequence('patientassessment', 'assessmentid'),     (SELECT MAX(AssessmentID)    FROM PatientAssessment));
SELECT setval(pg_get_serial_sequence('appointment',       'appointmentid'),    (SELECT MAX(AppointmentID)   FROM Appointment));
