-- ============================================================
-- HOSPITAL MANAGEMENT SYSTEM — FINAL SCHEMA
-- ============================================================


-- ======================
-- ENUMS
-- ======================

CREATE TYPE user_role          AS ENUM ('patient', 'doctor', 'nurse', 'admin');
CREATE TYPE room_type          AS ENUM ('General', 'Private', 'ICU', 'Emergency');
CREATE TYPE employee_type      AS ENUM ('Doctor', 'Nurse', 'Admin');
CREATE TYPE shift_type         AS ENUM ('Morning', 'Evening', 'Night');
CREATE TYPE gender_type        AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE blood_group        AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE condition_type     AS ENUM ('Stable', 'Moderate', 'Critical');
CREATE TYPE case_urgency       AS ENUM ('Routine', 'Urgent', 'Emergency');
CREATE TYPE case_status        AS ENUM ('Open', 'Accepted', 'Rejected', 'InProgress', 'Resolved', 'Cancelled');
CREATE TYPE appointment_type   AS ENUM ('Outpatient', 'Inpatient', 'Emergency', 'Followup');
CREATE TYPE appointment_status AS ENUM ('Scheduled', 'Completed', 'Cancelled', 'NoShow');
CREATE TYPE severity_type      AS ENUM ('Mild', 'Moderate', 'Severe');
CREATE TYPE lab_status         AS ENUM ('Ordered', 'Processing', 'Resulted');
CREATE TYPE insurance_status   AS ENUM ('Active', 'Expired', 'Claimed');
CREATE TYPE payment_status     AS ENUM ('Pending', 'Partial', 'Paid', 'Waived');
CREATE TYPE payment_method     AS ENUM ('Cash', 'Card', 'Insurance', 'Online');


-- ======================
-- USER
-- ======================

CREATE TABLE users (
    UserID       SERIAL PRIMARY KEY,
    Email        VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role         user_role NOT NULL,
    IsActive     BOOLEAN DEFAULT TRUE,
    CreatedOn    TIMESTAMP DEFAULT NOW(),
    LastLoginOn  TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_email_lower ON users(LOWER(Email));


-- ======================
-- DEPARTMENT
-- ======================

CREATE TABLE Department (
    DepartmentID SERIAL PRIMARY KEY,
    Name         VARCHAR(100) UNIQUE NOT NULL,
    Description  VARCHAR(255)
);


-- ======================
-- ROOM
-- ======================

CREATE TABLE Room (
    RoomID        SERIAL PRIMARY KEY,
    RoomNumber    VARCHAR(10) UNIQUE NOT NULL,
    Type          room_type NOT NULL,
    DepartmentID  INT NOT NULL REFERENCES Department(DepartmentID),
    IsOccupied    BOOLEAN DEFAULT FALSE,
    PricePerNight DECIMAL(10,2) NOT NULL
);


-- ======================
-- EMPLOYEE
-- ======================

CREATE TABLE Employee (
    EmployeeID     SERIAL PRIMARY KEY,
    UserID         INT UNIQUE REFERENCES users(UserID), -- Made Nullable
    SignupCode     VARCHAR(20),                          -- Added for registration flow
    EmployeeNumber VARCHAR(20) UNIQUE NOT NULL,
    FirstName      VARCHAR(50) NOT NULL,
    LastName       VARCHAR(50) NOT NULL,
    DateOfBirth    DATE,
    Gender         gender_type,
    PhoneNumber    VARCHAR(15),

    AddressLine1   VARCHAR(100),
    AddressLine2   VARCHAR(100),
    City           VARCHAR(50),
    State          VARCHAR(50),
    PostalCode     VARCHAR(10),
    Country        VARCHAR(50),

    DepartmentID   INT NOT NULL REFERENCES Department(DepartmentID),
    EmployeeType   employee_type NOT NULL,
    ShiftType      shift_type,
    JoiningDate    DATE,
    ProfilePicture VARCHAR(255),
    IsActive       BOOLEAN DEFAULT TRUE,
    CreatedOn      TIMESTAMP DEFAULT NOW()
);


-- ======================
-- DOCTOR PROFILE
-- ======================

CREATE TABLE DoctorProfile (
    EmployeeID       INT PRIMARY KEY REFERENCES Employee(EmployeeID),
    Specialization   VARCHAR(100) NOT NULL,
    LicenseNumber    VARCHAR(50) UNIQUE NOT NULL,
    Qualification    VARCHAR(100) NOT NULL,
    ExperienceYears  INT,
    ConsultationFee  DECIMAL(10,2),
    IsAcceptingCases BOOLEAN DEFAULT TRUE,
    AvailableDays    JSONB,
    AvailableFrom    TIME,
    AvailableTo      TIME
);


-- ======================
-- PATIENT
-- ======================

CREATE TABLE Patient (
    PatientID        SERIAL PRIMARY KEY,
    SignupCode       VARCHAR(20),
    IsRegistered     BOOLEAN DEFAULT FALSE,
    UserID           INT UNIQUE REFERENCES users(UserID),
    FirstName        VARCHAR(50) NOT NULL,
    LastName         VARCHAR(50) NOT NULL,
    DateOfBirth      DATE,
    Gender           gender_type,
    PhoneNumber      VARCHAR(15),
    EmergencyContact VARCHAR(15),
    BloodGroup       blood_group,
    Height           DECIMAL(5,2),
    Weight           DECIMAL(5,2),

    AddressLine1     VARCHAR(100),
    AddressLine2     VARCHAR(100),
    City             VARCHAR(50),
    State            VARCHAR(50),
    PostalCode       VARCHAR(10),
    Country          VARCHAR(50),

    ProfilePicture   VARCHAR(255),
    CreatedByAdminID INT NOT NULL REFERENCES Employee(EmployeeID),
    CreatedOn        TIMESTAMP DEFAULT NOW(),
    ModifiedOn       TIMESTAMP
);


-- ======================
-- INSURANCE
-- ======================

CREATE TABLE Insurance (
    InsuranceID       SERIAL PRIMARY KEY,
    ProviderName      VARCHAR(100) NOT NULL,
    PlanName          VARCHAR(100) NOT NULL,
    PlanType          VARCHAR(50),
    MaxCoverageAmount DECIMAL(10,2) NOT NULL,
    ContactNumber     VARCHAR(15),
    Website           VARCHAR(100),
    CreatedOn         TIMESTAMP DEFAULT NOW(),
    UNIQUE(ProviderName, PlanName)
);


-- ======================
-- PATIENT INSURANCE
-- ======================

CREATE TABLE PatientInsurance (
    PatientInsuranceID SERIAL PRIMARY KEY,
    PatientID          INT NOT NULL REFERENCES Patient(PatientID),
    InsuranceID        INT NOT NULL REFERENCES Insurance(InsuranceID),
    PolicyNumber       VARCHAR(50) UNIQUE NOT NULL,
    CoveragePercent    DECIMAL(5,2) NOT NULL,
    CoPay              DECIMAL(10,2) NOT NULL DEFAULT 0,
    ValidFrom          DATE NOT NULL,
    ValidTo            DATE NOT NULL,
    Status             insurance_status DEFAULT 'Active',
    CreatedOn          TIMESTAMP DEFAULT NOW(),

    UNIQUE(PatientID, InsuranceID),
    CHECK (CoveragePercent BETWEEN 0 AND 100),
    CHECK (CoPay >= 0)
);


-- ======================
-- DISEASE
-- ======================

CREATE TABLE Disease (
    DiseaseID      SERIAL PRIMARY KEY,
    Name           VARCHAR(100) UNIQUE NOT NULL,
    ICD10Code      VARCHAR(10),
    RelevantDeptID INT REFERENCES Department(DepartmentID)
);


-- ======================
-- PATIENT ASSESSMENT
-- ======================

CREATE TABLE PatientAssessment (
    AssessmentID    SERIAL PRIMARY KEY,
    PatientID       INT NOT NULL REFERENCES Patient(PatientID),
    NurseEmployeeID INT NOT NULL REFERENCES Employee(EmployeeID),
    Symptoms        TEXT NOT NULL,
    Condition       condition_type NOT NULL,

    Temperature     DECIMAL(4,1),
    SystolicBP      INT,
    DiastolicBP     INT,
    PulseRate       INT,
    OxygenLevel     DECIMAL(4,1),
    BloodSugar      DECIMAL(6,2),

    Notes           TEXT,
    AssessedOn      TIMESTAMP DEFAULT NOW()
);


-- ======================
-- CASE REQUEST
-- ======================

CREATE TABLE CaseRequest (
    CaseRequestID    SERIAL PRIMARY KEY,
    PatientID        INT NOT NULL REFERENCES Patient(PatientID),
    AssessmentID     INT UNIQUE NOT NULL REFERENCES PatientAssessment(AssessmentID),
    AssignedDeptID   INT NOT NULL REFERENCES Department(DepartmentID),
    DoctorEmployeeID INT REFERENCES Employee(EmployeeID),
    NurseEmployeeID  INT REFERENCES Employee(EmployeeID),
    RoomID           INT REFERENCES Room(RoomID),
    CreatedByAdminID INT NOT NULL REFERENCES Employee(EmployeeID),
    CaseSummary      TEXT NOT NULL,
    Urgency          case_urgency DEFAULT 'Routine',
    Status           case_status DEFAULT 'Open',
    IsAdmitted       BOOLEAN DEFAULT FALSE,
    AdmittedOn       TIMESTAMP,
    DischargedOn     TIMESTAMP,
    CreatedOn        TIMESTAMP DEFAULT NOW(),

    CHECK (DischargedOn IS NULL OR DischargedOn >= AdmittedOn)
);


-- ======================
-- APPOINTMENT
-- ======================

CREATE TABLE Appointment (
    AppointmentID    SERIAL PRIMARY KEY,
    CaseRequestID    INT NOT NULL REFERENCES CaseRequest(CaseRequestID),
    PatientID        INT NOT NULL REFERENCES Patient(PatientID),
    DoctorEmployeeID INT NOT NULL REFERENCES Employee(EmployeeID),
    CreatedByEmpID   INT NOT NULL REFERENCES Employee(EmployeeID),
    AppointmentDate  DATE NOT NULL,
    StartTime        TIME NOT NULL,
    EndTime          TIME NOT NULL,
    Type             appointment_type NOT NULL,
    Status           appointment_status DEFAULT 'Scheduled',
    CreatedOn        TIMESTAMP DEFAULT NOW(),

    CHECK (EndTime > StartTime),
    UNIQUE(DoctorEmployeeID, AppointmentDate, StartTime)
);


-- ======================
-- DIAGNOSIS
-- ======================

CREATE TABLE Diagnosis (
    CaseRequestID INT NOT NULL REFERENCES CaseRequest(CaseRequestID),
    DiseaseID     INT NOT NULL REFERENCES Disease(DiseaseID),
    Severity      severity_type,
    Notes         TEXT,
    DiagnosedOn   TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (CaseRequestID, DiseaseID)
);


-- ======================
-- PRESCRIPTION
-- ======================

CREATE TABLE Prescription (
    PrescriptionID SERIAL PRIMARY KEY,
    CaseRequestID  INT UNIQUE NOT NULL REFERENCES CaseRequest(CaseRequestID),
    Medicines      TEXT NOT NULL,
    Instructions   TEXT,
    PrescribedOn   TIMESTAMP DEFAULT NOW()
);


-- ======================
-- LAB TEST
-- ======================

CREATE TABLE LabTest (
    LabTestID    SERIAL PRIMARY KEY,
    TestName     VARCHAR(100) NOT NULL,
    TestCode     VARCHAR(20) UNIQUE NOT NULL,
    Description  TEXT,
    NormalRange  VARCHAR(50),
    Unit         VARCHAR(30),
    Price        DECIMAL(10,2) NOT NULL,
    DepartmentID INT REFERENCES Department(DepartmentID)
);


-- ======================
-- LAB REPORT
-- ======================

CREATE TABLE LabReport (
    ReportID      SERIAL PRIMARY KEY,
    CaseRequestID INT NOT NULL REFERENCES CaseRequest(CaseRequestID),
    LabTestID     INT NOT NULL REFERENCES LabTest(LabTestID),
    PatientID     INT NOT NULL REFERENCES Patient(PatientID),
    OrderedByID   INT NOT NULL REFERENCES Employee(EmployeeID),
    PerformedByID INT REFERENCES Employee(EmployeeID),
    TestValue     VARCHAR(100),
    Status        lab_status DEFAULT 'Ordered',
    OrderedOn     TIMESTAMP DEFAULT NOW(),
    ResultedOn    TIMESTAMP,
    IsBilled      BOOLEAN DEFAULT FALSE,

    UNIQUE(CaseRequestID, LabTestID),
    CHECK (ResultedOn IS NULL OR ResultedOn >= OrderedOn)
);


-- ======================
-- BILL
-- ======================

CREATE TABLE Bill (
    BillID             SERIAL PRIMARY KEY,
    CaseRequestID      INT NOT NULL REFERENCES CaseRequest(CaseRequestID),
    PatientInsuranceID INT REFERENCES PatientInsurance(PatientInsuranceID),

    ConsultationFee    DECIMAL(10,2) NOT NULL DEFAULT 0,
    RoomCharges        DECIMAL(10,2) NOT NULL DEFAULT 0,
    LabCharges         DECIMAL(10,2) NOT NULL DEFAULT 0,
    MedicineCharges    DECIMAL(10,2) NOT NULL DEFAULT 0,
    OtherCharges       DECIMAL(10,2) NOT NULL DEFAULT 0,
    Discount           DECIMAL(10,2) NOT NULL DEFAULT 0,
    InsuranceCovered   DECIMAL(10,2) NOT NULL DEFAULT 0,

    TotalAmount        DECIMAL(10,2) NOT NULL,
    

    PaymentStatus      payment_status NOT NULL DEFAULT 'Pending',
    PaymentMethod      payment_method,

    GeneratedOn        TIMESTAMP DEFAULT NOW(),
    PaidOn             TIMESTAMP,

    CHECK (TotalAmount = ConsultationFee + RoomCharges + LabCharges + MedicineCharges + OtherCharges),
 
    CHECK (Discount >= 0),
    CHECK (InsuranceCovered >= 0),
    CHECK (PaidOn IS NULL OR PaidOn >= GeneratedOn)
);


-- ======================
-- FEEDBACK
-- ======================

CREATE TABLE Feedback (
    PatientID     INT NOT NULL REFERENCES Patient(PatientID),
    EmployeeID    INT NOT NULL REFERENCES Employee(EmployeeID),
    CaseRequestID INT NOT NULL REFERENCES CaseRequest(CaseRequestID),
    Rating        SMALLINT CHECK (Rating BETWEEN 1 AND 5),
    Comment       TEXT,
    CreatedOn     TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (PatientID, CaseRequestID, EmployeeID)
);


-- ======================
-- INDEXES
-- ======================

CREATE INDEX idx_caserequest_patient ON CaseRequest(PatientID);
CREATE INDEX idx_caserequest_status  ON CaseRequest(Status);
CREATE INDEX idx_caserequest_doctor  ON CaseRequest(DoctorEmployeeID);

CREATE INDEX idx_appointment_date    ON Appointment(AppointmentDate);
CREATE INDEX idx_appointment_patient ON Appointment(PatientID);

CREATE INDEX idx_labreport_patient   ON LabReport(PatientID);
CREATE INDEX idx_labreport_status    ON LabReport(Status);
CREATE INDEX idx_labreport_unbilled  ON LabReport(IsBilled) WHERE IsBilled = FALSE;

CREATE INDEX idx_bill_caserequest    ON Bill(CaseRequestID);
CREATE INDEX idx_bill_paymentstatus  ON Bill(PaymentStatus);

CREATE INDEX idx_feedback_employee   ON Feedback(EmployeeID);