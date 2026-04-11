-- ============================================================
-- HMS DEMO SEED DATA — FIXED VERSION
-- Run in Supabase Dashboard → SQL Editor
-- Password for ALL accounts: password123
--
-- NOTE: Tables created without quotes in schema.sql are stored
--       as lowercase by PostgreSQL (e.g. Department → department)
--       Only "User" was quoted in schema.sql, so it stays "User"
-- ============================================================


-- ============================================================
-- STEP 1: DEPARTMENTS
-- (table name: department, columns: name, description)
-- ============================================================
INSERT INTO department (name, description) VALUES
  ('General Medicine',   'General outpatient and inpatient care'),
  ('Cardiology',         'Heart and cardiovascular disorders'),
  ('Neurology',          'Brain, spinal cord and nervous system'),
  ('Emergency',          'Emergency and trauma care'),
  ('Administration',     'Hospital administration and management')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- STEP 2: ROOMS
-- (table name: room)
-- ============================================================
INSERT INTO room (roomnumber, type, departmentid, isoccupied, pricepernight) VALUES
  ('G-101', 'General',   (SELECT departmentid FROM department WHERE name = 'General Medicine'), false, 1500.00),
  ('G-102', 'General',   (SELECT departmentid FROM department WHERE name = 'General Medicine'), false, 1500.00),
  ('C-201', 'Private',   (SELECT departmentid FROM department WHERE name = 'Cardiology'),       false, 4500.00),
  ('N-301', 'Private',   (SELECT departmentid FROM department WHERE name = 'Neurology'),        false, 4000.00),
  ('ICU-1', 'ICU',       (SELECT departmentid FROM department WHERE name = 'Emergency'),        false, 12000.00),
  ('E-401', 'Emergency', (SELECT departmentid FROM department WHERE name = 'Emergency'),        false, 8000.00)
ON CONFLICT (roomnumber) DO NOTHING;


-- ============================================================
-- STEP 3: CREATE AUTH USERS IN SUPABASE AUTH
-- Password for all: password123
-- ============================================================

-- Admin
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'admin@hospital.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"role":"admin","first_name":"Rajesh","last_name":"Kumar"}',
  '{"provider":"email","providers":["email"]}',
  NOW(), NOW(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- Doctor
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'doctor@hospital.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"role":"doctor","first_name":"Priya","last_name":"Sharma"}',
  '{"provider":"email","providers":["email"]}',
  NOW(), NOW(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- Nurse
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'nurse@hospital.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"role":"nurse","first_name":"Ananya","last_name":"Reddy"}',
  '{"provider":"email","providers":["email"]}',
  NOW(), NOW(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- Patient
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'patient@hospital.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"role":"patient","first_name":"Arjun","last_name":"Mehta"}',
  '{"provider":"email","providers":["email"]}',
  NOW(), NOW(), '', '', '', ''
) ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- STEP 4: "User" TABLE  (THIS one IS quoted because schema.sql
--          explicitly used: CREATE TABLE "User" (...))
-- ============================================================
INSERT INTO "User" (email, passwordhash, role, isactive) VALUES
  ('admin@hospital.com',   'managed_by_supabase_auth', 'admin',   true),
  ('doctor@hospital.com',  'managed_by_supabase_auth', 'doctor',  true),
  ('nurse@hospital.com',   'managed_by_supabase_auth', 'nurse',   true),
  ('patient@hospital.com', 'managed_by_supabase_auth', 'patient', true)
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- STEP 5: EMPLOYEES  (Admin, Doctor, Nurse)
-- ============================================================
INSERT INTO employee (
  userid, employeenumber, firstname, lastname,
  dateofbirth, gender, phonenumber,
  addressline1, city, state, postalcode, country,
  departmentid, employeetype, shifttype, joiningdate, isactive
) VALUES
(
  (SELECT userid FROM "User" WHERE email = 'admin@hospital.com'),
  'EMP-0001', 'Rajesh', 'Kumar',
  '1975-03-15', 'Male', '+91-9876543210',
  '12 MG Road', 'Bengaluru', 'Karnataka', '560001', 'India',
  (SELECT departmentid FROM department WHERE name = 'Administration'),
  'Admin', 'Morning', '2010-01-01', true
),
(
  (SELECT userid FROM "User" WHERE email = 'doctor@hospital.com'),
  'EMP-0002', 'Priya', 'Sharma',
  '1985-07-22', 'Female', '+91-9876501234',
  '45 Jubilee Hills', 'Hyderabad', 'Telangana', '500033', 'India',
  (SELECT departmentid FROM department WHERE name = 'Cardiology'),
  'Doctor', 'Morning', '2015-06-01', true
),
(
  (SELECT userid FROM "User" WHERE email = 'nurse@hospital.com'),
  'EMP-0003', 'Ananya', 'Reddy',
  '1992-11-08', 'Female', '+91-9876512345',
  '8 Anna Nagar', 'Chennai', 'Tamil Nadu', '600040', 'India',
  (SELECT departmentid FROM department WHERE name = 'General Medicine'),
  'Nurse', 'Evening', '2018-03-15', true
)
ON CONFLICT (employeenumber) DO NOTHING;


-- ============================================================
-- STEP 6: DOCTOR PROFILE
-- ============================================================
INSERT INTO doctorprofile (
  employeeid, specialization, licensenumber,
  qualification, experienceyears, consultationfee,
  isacceptingcases, availabledays, availablefrom, availableto
) VALUES (
  (SELECT employeeid FROM employee WHERE employeenumber = 'EMP-0002'),
  'Interventional Cardiology',
  'MCI-KA-2015-88421',
  'MBBS, MD (Cardiology), DM',
  10,
  1200.00,
  true,
  '["Monday","Tuesday","Wednesday","Thursday","Friday"]',
  '09:00', '17:00'
) ON CONFLICT (employeeid) DO NOTHING;


-- ============================================================
-- STEP 7: PATIENT RECORD
-- ============================================================
INSERT INTO patient (
  signupcode, isregistered, userid,
  firstname, lastname, dateofbirth, gender,
  phonenumber, emergencycontact, bloodgroup,
  height, weight,
  addressline1, city, state, postalcode, country,
  createdbyadminid
) VALUES (
  'PAT-2025-001',
  true,
  (SELECT userid FROM "User" WHERE email = 'patient@hospital.com'),
  'Arjun', 'Mehta',
  '1990-05-10', 'Male',
  '+91-9123456789', '+91-9123456780',
  'B+', 175.00, 72.00,
  '22 Bandra West', 'Mumbai', 'Maharashtra', '400050', 'India',
  (SELECT employeeid FROM employee WHERE employeenumber = 'EMP-0001')
) ON CONFLICT DO NOTHING;


-- ============================================================
-- STEP 8: UPDATE auth.users METADATA with IDs
-- ============================================================
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data ||
  jsonb_build_object('employee_id', (SELECT employeeid FROM employee WHERE employeenumber = 'EMP-0001'))
WHERE email = 'admin@hospital.com';

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data ||
  jsonb_build_object('employee_id', (SELECT employeeid FROM employee WHERE employeenumber = 'EMP-0002'))
WHERE email = 'doctor@hospital.com';

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data ||
  jsonb_build_object('employee_id', (SELECT employeeid FROM employee WHERE employeenumber = 'EMP-0003'))
WHERE email = 'nurse@hospital.com';

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data ||
  jsonb_build_object('patient_id', (SELECT patientid FROM patient WHERE signupcode = 'PAT-2025-001'))
WHERE email = 'patient@hospital.com';


-- ============================================================
-- STEP 9: DISEASES
-- ============================================================
INSERT INTO disease (name, icd10code, relevantdeptid) VALUES
  ('Hypertensive Heart Disease',  'I11',   (SELECT departmentid FROM department WHERE name = 'Cardiology')),
  ('Acute Myocardial Infarction', 'I21',   (SELECT departmentid FROM department WHERE name = 'Cardiology')),
  ('Type 2 Diabetes Mellitus',    'E11',   (SELECT departmentid FROM department WHERE name = 'General Medicine')),
  ('Migraine',                    'G43',   (SELECT departmentid FROM department WHERE name = 'Neurology')),
  ('Community-acquired Pneumonia','J18.9', (SELECT departmentid FROM department WHERE name = 'General Medicine'))
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- STEP 10: ASSESSMENT → CASE → APPOINTMENT CHAIN
-- ============================================================
WITH new_assessment AS (
  INSERT INTO patientassessment (
    patientid, nurseemployeeid,
    symptoms, condition,
    temperature, systolicbp, diastolicbp,
    pulserate, oxygenlevel, bloodsugar,
    notes
  ) VALUES (
    (SELECT patientid FROM patient WHERE signupcode = 'PAT-2025-001'),
    (SELECT employeeid FROM employee WHERE employeenumber = 'EMP-0003'),
    'Chest pain, shortness of breath, mild dizziness on exertion',
    'Moderate',
    37.2, 148, 92, 88, 96.5, 105.00,
    'Patient reports symptoms worsening over past 3 days. Referred for cardiology evaluation.'
  )
  RETURNING assessmentid
),
new_case AS (
  INSERT INTO caserequest (
    patientid, assessmentid, assigneddeptid,
    doctoremployeeid, nurseemployeeid, roomid,
    createdbyadminid, casesummary, urgency, status,
    isadmitted, admittedon
  ) VALUES (
    (SELECT patientid FROM patient WHERE signupcode = 'PAT-2025-001'),
    (SELECT assessmentid FROM new_assessment),
    (SELECT departmentid FROM department WHERE name = 'Cardiology'),
    (SELECT employeeid FROM employee WHERE employeenumber = 'EMP-0002'),
    (SELECT employeeid FROM employee WHERE employeenumber = 'EMP-0003'),
    (SELECT roomid FROM room WHERE roomnumber = 'C-201'),
    (SELECT employeeid FROM employee WHERE employeenumber = 'EMP-0001'),
    'Possible hypertensive cardiac event. Patient presented with chest pain and elevated BP. Admitted for monitoring and cardiology workup.',
    'Urgent', 'InProgress',
    true, NOW()
  )
  RETURNING caserequestid
)
INSERT INTO appointment (
  caserequestid, patientid, doctoremployeeid,
  createdbyempid, appointmentdate, starttime, endtime,
  type, status
) VALUES (
  (SELECT caserequestid FROM new_case),
  (SELECT patientid FROM patient WHERE signupcode = 'PAT-2025-001'),
  (SELECT employeeid FROM employee WHERE employeenumber = 'EMP-0002'),
  (SELECT employeeid FROM employee WHERE employeenumber = 'EMP-0001'),
  CURRENT_DATE + INTERVAL '1 day',
  '10:00', '10:30',
  'Inpatient', 'Scheduled'
);

-- Mark C-201 as occupied
UPDATE room SET isoccupied = true WHERE roomnumber = 'C-201';


-- ============================================================
-- VERIFICATION — uncomment and run to confirm row counts
-- ============================================================
/*
SELECT 'auth.users'       AS tbl, COUNT(*) FROM auth.users         WHERE email LIKE '%@hospital.com'
UNION ALL
SELECT '"User"',                   COUNT(*) FROM "User"
UNION ALL
SELECT 'department',               COUNT(*) FROM department
UNION ALL
SELECT 'room',                     COUNT(*) FROM room
UNION ALL
SELECT 'employee',                 COUNT(*) FROM employee
UNION ALL
SELECT 'doctorprofile',            COUNT(*) FROM doctorprofile
UNION ALL
SELECT 'patient',                  COUNT(*) FROM patient
UNION ALL
SELECT 'disease',                  COUNT(*) FROM disease
UNION ALL
SELECT 'patientassessment',        COUNT(*) FROM patientassessment
UNION ALL
SELECT 'caserequest',              COUNT(*) FROM caserequest
UNION ALL
SELECT 'appointment',              COUNT(*) FROM appointment;
*/
