-- ============================================================
-- HMS TRIGGERS
-- ============================================================

-- ============================================================
-- TRIGGER 1: Prevent double-booking of a doctor at the same time
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM Appointment
        WHERE DoctorEmployeeID = NEW.DoctorEmployeeID
          AND AppointmentDate  = NEW.AppointmentDate
          AND StartTime        = NEW.StartTime
          AND AppointmentID   != COALESCE(NEW.AppointmentID, -1)
    ) THEN
        RAISE EXCEPTION 'Doctor already has an appointment at this time';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_double_booking ON Appointment;
CREATE TRIGGER trg_prevent_double_booking
BEFORE INSERT OR UPDATE ON Appointment
FOR EACH ROW
EXECUTE FUNCTION prevent_double_booking();


-- ============================================================
-- TRIGGER 2: Auto-set case status to Resolved when DischargedOn is set
-- ============================================================
CREATE OR REPLACE FUNCTION auto_complete_case()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.DischargedOn IS NOT NULL AND OLD.DischargedOn IS NULL THEN
        NEW.Status := 'Resolved';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_complete_case ON CaseRequest;
CREATE TRIGGER trg_auto_complete_case
BEFORE UPDATE ON CaseRequest
FOR EACH ROW
EXECUTE FUNCTION auto_complete_case();


-- ============================================================
-- TRIGGER 3: Auto-calculate TotalAmount on Bill insert/update
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_total_bill()
RETURNS TRIGGER AS $$
BEGIN
    NEW.TotalAmount :=
        NEW.ConsultationFee +
        NEW.RoomCharges     +
        NEW.LabCharges      +
        NEW.MedicineCharges +
        NEW.OtherCharges    -
        NEW.Discount;        -- ✅ added Discount
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_bill ON Bill;
CREATE TRIGGER trg_calculate_bill
BEFORE INSERT OR UPDATE ON Bill
FOR EACH ROW
EXECUTE FUNCTION calculate_total_bill();


-- ============================================================
-- TRIGGER 4: Mark room occupied/free based on admission status
-- ============================================================
CREATE OR REPLACE FUNCTION update_room_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.IsAdmitted = TRUE THEN
        UPDATE Room SET IsOccupied = TRUE  WHERE RoomID = NEW.RoomID;
    END IF;
    IF NEW.DischargedOn IS NOT NULL THEN
        UPDATE Room SET IsOccupied = FALSE WHERE RoomID = NEW.RoomID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_room_status ON CaseRequest;
CREATE TRIGGER trg_room_status
AFTER INSERT OR UPDATE ON CaseRequest
FOR EACH ROW
EXECUTE FUNCTION update_room_status();


-- ============================================================
-- TRIGGER 5: Auto-set ResultedOn timestamp when lab status becomes 'Resulted'
-- ============================================================
CREATE OR REPLACE FUNCTION set_resulted_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Status = 'Resulted' AND OLD.Status != 'Resulted' THEN
        NEW.ResultedOn := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lab_result_time ON LabReport;
CREATE TRIGGER trg_lab_result_time
BEFORE UPDATE ON LabReport
FOR EACH ROW
EXECUTE FUNCTION set_resulted_time();



/*
-- ============================================================
-- TRIGGER 6: Notify on Emergency case creation
-- ============================================================
CREATE OR REPLACE FUNCTION notify_emergency_case()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Urgency = 'Emergency' THEN
        INSERT INTO Notifications (Title, Message, Type)
        VALUES (
            '🚨 Emergency Case Detected',
            'New emergency case #' || NEW.CaseRequestID || ' has been registered.',
            'emergency'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_emergency ON CaseRequest;
CREATE TRIGGER trg_notify_emergency
AFTER INSERT ON CaseRequest
FOR EACH ROW
EXECUTE FUNCTION notify_emergency_case();


-- ============================================================
-- TRIGGER 7: Notify when a patient submits new feedback
-- ============================================================
CREATE OR REPLACE FUNCTION notify_new_feedback()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO Notifications (Title, Message, Type)
    VALUES (
        '💬 New Patient Feedback',
        'A patient has submitted a new rating and comment.',
        'feedback'
      );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_feedback ON Feedback;
CREATE TRIGGER trg_notify_feedback
AFTER INSERT ON Feedback
FOR EACH ROW
EXECUTE FUNCTION notify_new_feedback();
*/
