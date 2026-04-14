-- ==========================================
-- BILLING AGGREGATION ENGINE
-- ==========================================
CREATE OR REPLACE FUNCTION fn_generate_bill(p_case_request_id INT)
RETURNS TABLE (
    bill_id            INT,
    total_amount       DECIMAL,
    insurance_covered  DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_case_exists        BOOLEAN;
    v_case_status        case_status;
    v_patient_id         INT;
    v_consultation_fee   DECIMAL := 500.00;
    v_lab_charges        DECIMAL := 0;
    v_room_charges       DECIMAL := 0;
    v_rx_count           INT := 0;
    v_medicine_charges   DECIMAL := 0;
    v_total_amount       DECIMAL := 0;
    v_insurance_covered  DECIMAL := 0;
    v_final_amount       DECIMAL := 0;
    v_patient_ins_id     INT := NULL;
    v_coverage_percent   DECIMAL := 0;
    
    -- temporary vars for room tracking
    v_assessed_on        TIMESTAMP;
    v_room_price         DECIMAL;
    v_days_stayed        INT;
BEGIN
    SELECT EXISTS(SELECT 1 FROM CaseRequest WHERE CaseRequestID = p_case_request_id) INTO v_case_exists;
    IF NOT v_case_exists THEN
        RAISE EXCEPTION 'Case request % does not exist', p_case_request_id;
    END IF;

    SELECT PatientID, Status INTO v_patient_id, v_case_status FROM CaseRequest WHERE CaseRequestID = p_case_request_id;
    
    -- Lab charges
    SELECT COALESCE(SUM(lt.Price), 0) INTO v_lab_charges
    FROM LabReport lr
    JOIN LabTest lt ON lr.LabTestID = lt.LabTestID
    WHERE lr.CaseRequestID = p_case_request_id;

    -- Room charges
    SELECT cr.AdmittedOn, r.PricePerNight INTO v_assessed_on, v_room_price
    FROM CaseRequest cr
    JOIN Room r ON cr.RoomID = r.RoomID
    WHERE cr.CaseRequestID = p_case_request_id;

    IF v_assessed_on IS NOT NULL THEN
        v_days_stayed := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (NOW() - v_assessed_on)) / 86400));
        v_room_charges := v_days_stayed * v_room_price;
    END IF;

    -- Medicine charges
    SELECT COUNT(*) INTO v_rx_count FROM Prescription WHERE CaseRequestID = p_case_request_id;
    v_medicine_charges := v_rx_count * 200.00;

    -- Base calculation
    v_total_amount := v_consultation_fee + v_lab_charges + v_room_charges + v_medicine_charges;

    -- Insurance lookup
    SELECT PatientInsuranceID, CoveragePercent INTO v_patient_ins_id, v_coverage_percent
    FROM PatientInsurance 
    WHERE PatientID = v_patient_id AND Status = 'Active' LIMIT 1;

    IF v_patient_ins_id IS NOT NULL THEN
        v_insurance_covered := v_total_amount * (v_coverage_percent / 100.0);
    END IF;

    v_final_amount := v_total_amount - v_insurance_covered;

    -- Insert safely
    INSERT INTO bill (
        CaseRequestID, PatientInsuranceID, ConsultationFee, RoomCharges, LabCharges, MedicineCharges, OtherCharges, Discount, InsuranceCovered, TotalAmount, PaymentStatus
    ) VALUES (
        p_case_request_id, v_patient_ins_id, v_consultation_fee, v_room_charges, v_lab_charges, v_medicine_charges, 0, 0, v_insurance_covered, v_total_amount, 'Pending'
    ) RETURNING BillID INTO bill_id;

    RETURN QUERY SELECT bill_id, v_final_amount, v_insurance_covered;
END;
$$;

-- ==========================================
-- TRIGGER: AUTO FREE ROOM UPON RESOLUTION
-- ==========================================
CREATE OR REPLACE FUNCTION fn_free_room_on_resolve()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If status flipped to Resolved, free the room attached to this case
    IF OLD.Status != 'Resolved' AND NEW.Status = 'Resolved' AND NEW.RoomID IS NOT NULL THEN
        UPDATE Room SET IsOccupied = FALSE WHERE RoomID = NEW.RoomID;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_free_room_on_resolution ON CaseRequest;
CREATE TRIGGER trg_free_room_on_resolution
AFTER UPDATE OF Status ON CaseRequest
FOR EACH ROW
EXECUTE FUNCTION fn_free_room_on_resolve();
