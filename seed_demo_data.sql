-- ============================================================
-- HMS FULL DEMO SEED DATA (FINAL STABLE VERSION)
-- Run in Supabase Dashboard → SQL Editor
-- Default Password for ALL accounts: password123
-- ============================================================

-- 0. CLEANUP (Removes old data to ensure IDs start fresh)
TRUNCATE users, Department, Employee, Patient, Room, DoctorProfile, 
         CaseRequest, Appointment, PatientAssessment, Diagnosis, 
         Prescription, LabTest, LabReport, Bill, Feedback, Insurance, 
         PatientInsurance, Disease RESTART IDENTITY CASCADE;

-- 1. AUTH USERS (Correct Seeding with Identities)
DO $$
DECLARE
  v_admin_id    UUID := gen_random_uuid();
  v_doctor_r_id UUID := gen_random_uuid();
  v_doctor_p_id UUID := gen_random_uuid();
  v_nurse_id    UUID := gen_random_uuid();
  v_patient_id  UUID := gen_random_uuid();
BEGIN
  -- Clean up specific demo auth accounts
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('admin1@hospital.com', 'dr.rajesh@hospital.com', 'dr.priya@hospital.com', 'nurse.kavya@hospital.com', 'patient.aarav@gmail.com'));
  DELETE FROM auth.users WHERE email IN ('admin1@hospital.com', 'dr.rajesh@hospital.com', 'dr.priya@hospital.com', 'nurse.kavya@hospital.com', 'patient.aarav@gmail.com');

  -- Admin
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, confirmation_token, recovery_token, email_change_token_new, is_super_admin)
  VALUES (v_admin_id, '00000000-0000-0000-0000-000000000000', 'admin1@hospital.com', crypt('password123', gen_salt('bf')), NOW(), '{"role":"admin"}'::jsonb, 'authenticated', 'authenticated', '', '', '', false);
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_admin_id, v_admin_id, format('{"sub":"%s","email":"%s"}', v_admin_id, 'admin1@hospital.com')::jsonb, 'email', v_admin_id::text, NOW(), NOW(), NOW());

  -- Doctor Rajesh
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, confirmation_token, recovery_token, email_change_token_new, is_super_admin)
  VALUES (v_doctor_r_id, '00000000-0000-0000-0000-000000000000', 'dr.rajesh@hospital.com', crypt('password123', gen_salt('bf')), NOW(), '{"role":"doctor"}'::jsonb, 'authenticated', 'authenticated', '', '', '', false);
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_doctor_r_id, v_doctor_r_id, format('{"sub":"%s","email":"%s"}', v_doctor_r_id, 'dr.rajesh@hospital.com')::jsonb, 'email', v_doctor_r_id::text, NOW(), NOW(), NOW());

  -- Doctor Priya
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, confirmation_token, recovery_token, email_change_token_new, is_super_admin)
  VALUES (v_doctor_p_id, '00000000-0000-0000-0000-000000000000', 'dr.priya@hospital.com', crypt('password123', gen_salt('bf')), NOW(), '{"role":"doctor"}'::jsonb, 'authenticated', 'authenticated', '', '', '', false);
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_doctor_p_id, v_doctor_p_id, format('{"sub":"%s","email":"%s"}', v_doctor_p_id, 'dr.priya@hospital.com')::jsonb, 'email', v_doctor_p_id::text, NOW(), NOW(), NOW());

  -- Nurse Kavya
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, confirmation_token, recovery_token, email_change_token_new, is_super_admin)
  VALUES (v_nurse_id, '00000000-0000-0000-0000-000000000000', 'nurse.kavya@hospital.com', crypt('password123', gen_salt('bf')), NOW(), '{"role":"nurse"}'::jsonb, 'authenticated', 'authenticated', '', '', '', false);
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_nurse_id, v_nurse_id, format('{"sub":"%s","email":"%s"}', v_nurse_id, 'nurse.kavya@hospital.com')::jsonb, 'email', v_nurse_id::text, NOW(), NOW(), NOW());

  -- Patient Aarav
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, confirmation_token, recovery_token, email_change_token_new, is_super_admin)
  VALUES (v_patient_id, '00000000-0000-0000-0000-000000000000', 'patient.aarav@gmail.com', crypt('password123', gen_salt('bf')), NOW(), '{"role":"patient"}'::jsonb, 'authenticated', 'authenticated', '', '', '', false);
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_patient_id, v_patient_id, format('{"sub":"%s","email":"%s"}', v_patient_id, 'patient.aarav@gmail.com')::jsonb, 'email', v_patient_id::text, NOW(), NOW(), NOW());
END $$;

-- 2. PUBLIC USERS
INSERT INTO users (UserID, Email, PasswordHash, Role, IsActive) VALUES
(1,  'admin1@hospital.com',    'managed_by_supabase_auth', 'admin',   TRUE),
(2,  'admin2@hospital.com',    'managed_by_supabase_auth', 'admin',   TRUE),
(3,  'dr.rajesh@hospital.com', 'managed_by_supabase_auth', 'doctor',  TRUE),
(4,  'dr.priya@hospital.com',  'managed_by_supabase_auth', 'doctor',  TRUE),
(5,  'dr.arjun@hospital.com',  'managed_by_supabase_auth', 'doctor',  TRUE),
(6,  'dr.meena@hospital.com',  'managed_by_supabase_auth', 'doctor',  TRUE),
(7,  'dr.suresh@hospital.com', 'managed_by_supabase_auth', 'doctor',  TRUE),
(8,  'nurse.kavya@hospital.com','managed_by_supabase_auth','nurse',   TRUE),
(9,  'nurse.anjali@hospital.com','managed_by_supabase_auth','nurse',  TRUE),
(10, 'nurse.deepa@hospital.com', 'managed_by_supabase_auth','nurse',  TRUE),
(11, 'patient.aarav@gmail.com',  'managed_by_supabase_auth','patient', TRUE),
(12, 'patient.sneha@gmail.com',  'managed_by_supabase_auth','patient', TRUE),
(13, 'patient.ravi@gmail.com',   'managed_by_supabase_auth','patient', TRUE),
(14, 'patient.lakshmi@gmail.com','managed_by_supabase_auth','patient', TRUE),
(15, 'patient.kiran@gmail.com',  'managed_by_supabase_auth','patient', TRUE);

-- 3. DEPARTMENTS
INSERT INTO Department (DepartmentID, Name, Description) VALUES
(1, 'Cardiology',        'Heart and cardiovascular system'),
(2, 'Neurology',         'Brain and nervous system'),
(3, 'Orthopedics',       'Bones, joints and muscles'),
(4, 'General Medicine',  'General health and internal medicine'),
(5, 'Pediatrics',        'Medical care for children'),
(6, 'Dermatology',       'Skin, hair and nail conditions'),
(7, 'Pathology',         'Lab testing and disease diagnosis'),
(8, 'Emergency',         'Urgent and emergency care');

-- 4. ROOMS
INSERT INTO Room (RoomNumber, Type, DepartmentID, IsOccupied, PricePerNight) VALUES
('101', 'General',   1, FALSE, 1500.00), ('102', 'Private',   1, TRUE,  4000.00), ('103', 'ICU', 1, TRUE, 9000.00),
('201', 'General',   2, FALSE, 1500.00), ('202', 'Private',   2, FALSE, 4000.00), ('203', 'ICU', 2, TRUE, 9000.00),
('301', 'General',   3, FALSE, 1500.00), ('302', 'Private',   3, TRUE,  4000.00),
('401', 'General',   4, FALSE, 1500.00), ('402', 'Private',   4, FALSE, 4000.00),
('501', 'General',   5, FALSE, 1500.00), ('601', 'General',   6, FALSE, 1500.00),
('801', 'Emergency', 8, TRUE,  6000.00), ('802', 'Emergency', 8, FALSE, 6000.00);

-- 5. EMPLOYEES
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

-- 6. DOCTOR PROFILES
INSERT INTO DoctorProfile (EmployeeID, Specialization, LicenseNumber, Qualification, ExperienceYears, ConsultationFee) VALUES
(3, 'Cardiology',  'KL-MCI-2018-01', 'MD, DM Cardiology',  12, 800.00),
(4, 'Neurology',   'KL-MCI-2019-02', 'MD, DM Neurology',   10, 700.00),
(5, 'Orthopedics', 'KL-MCI-2019-03', 'MS Orthopedics',     11, 750.00),
(6, 'Medicine',    'KL-MCI-2020-04', 'MD General Medicine', 9, 500.00),
(7, 'Pediatrics',  'KL-MCI-2017-05', 'MD Pediatrics',      13, 600.00);

-- 7. PATIENTS
INSERT INTO Patient (PatientID, SignupCode, IsRegistered, UserID, FirstName, LastName, Gender, PhoneNumber, City, CreatedByAdminID) VALUES
(1, 'PAT202401', TRUE, 11, 'Aarav',   'Shah',      'Male',   '9845001001', 'Kochi', 1),
(2, 'PAT202402', TRUE, 12, 'Sneha',   'Pillai',    'Female', '9845001002', 'Ernakulam', 1),
(3, 'PAT202403', TRUE, 13, 'Ravi',    'Nambiar',   'Male',   '9845001003', 'Thrissur', 1),
(4, 'PAT202404', TRUE, 14, 'Lakshmi', 'Devi',      'Female', '9845001004', 'Kozhikode', 2),
(5, 'PAT202405', TRUE, 15, 'Kiran',   'Raj',       'Male',   '9845001005', 'Kollam', 2);

-- 8. ASSESSMENTS
INSERT INTO PatientAssessment (AssessmentID, PatientID, NurseEmployeeID, Symptoms, Condition) VALUES
(1, 1, 8, 'Chest pain, shortness of breath', 'Moderate'),
(2, 2, 9, 'Severe headache, nausea',          'Stable');

-- 9. CASE REQUESTS
INSERT INTO CaseRequest (CaseRequestID, PatientID, AssessmentID, AssignedDeptID, DoctorEmployeeID, NurseEmployeeID, CreatedByAdminID, CaseSummary, Urgency, Status) VALUES
(1, 1, 1, 1, 3, 8, 1, 'Patient presenting with acute chest pain and shortness of breath.', 'Urgent',  'Resolved'),
(2, 2, 2, 2, 4, 9, 1, 'Chronic severe headache with nausea, query neurological assessment.', 'Routine', 'Resolved');

-- 10. APPOINTMENTS
INSERT INTO Appointment (CaseRequestID, PatientID, DoctorEmployeeID, CreatedByEmpID, AppointmentDate, StartTime, EndTime, Type, Status) VALUES
(1, 1, 3, 1, CURRENT_DATE, '10:00:00', '10:30:00', 'Inpatient', 'Completed'),
(2, 2, 4, 1, CURRENT_DATE, '11:00:00', '11:30:00', 'Outpatient', 'Completed');

-- 11. RESET SEQUENCES
SELECT setval(pg_get_serial_sequence('users', 'userid'), (SELECT MAX(UserID) FROM users));
SELECT setval(pg_get_serial_sequence('department', 'departmentid'), (SELECT MAX(DepartmentID) FROM Department));
SELECT setval(pg_get_serial_sequence('employee', 'employeeid'), (SELECT MAX(EmployeeID) FROM Employee));
SELECT setval(pg_get_serial_sequence('patient', 'patientid'), (SELECT MAX(PatientID) FROM Patient));
SELECT setval(pg_get_serial_sequence('caserequest', 'caserequestid'), (SELECT MAX(CaseRequestID) FROM CaseRequest));
SELECT setval(pg_get_serial_sequence('patientassessment', 'assessmentid'), (SELECT MAX(AssessmentID) FROM PatientAssessment));
