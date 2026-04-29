import express from 'express';
import { query } from '../db.js';
import {
  mapDoctorDiagnosisRowToUi,
  mapDoctorPrescriptionRowToUi,
  splitDoctorName,
} from '../utils/viewMappers.js';

const router = express.Router();

// --- CASES ---
router.get('/cases', async (req, res) => {
  try {
    let sql = `
      SELECT cr.*, p.firstname, p.lastname, p.gender, p.bloodgroup, p.dateofbirth, d.name as department_name
      FROM caserequest cr 
      LEFT JOIN patient p ON cr.patientid = p.patientid 
      LEFT JOIN department d ON cr.assigneddeptid = d.departmentid
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (req.query.status) {
      if (req.query.status !== 'All') {
        sql += ` AND cr.status = $${idx++}`;
        params.push(req.query.status);
      }
    }

    if (req.query.assigneddeptid) {
      sql += ` AND cr.assigneddeptid = $${idx++}`;
      params.push(req.query.assigneddeptid);
    }

    if (req.query.doctoremployeeid) {
      sql += ` AND cr.doctoremployeeid = $${idx++}`;
      params.push(req.query.doctoremployeeid);
    }

    if (req.query.isadmitted !== undefined) {
      sql += ` AND cr.isadmitted = $${idx++}`;
      params.push(req.query.isadmitted === 'true');
    }

    sql += ' ORDER BY cr.createdon DESC';

    const result = await query(sql, params);

    const formatted = result.rows.map(row => {
      const { firstname, lastname, gender, bloodgroup, dateofbirth, department_name, ...caseData } = row;
      return {
        ...caseData,
        patient: { firstname, lastname, gender, bloodgroup, dateofbirth },
        department: { name: department_name }
      };
    });

    res.json(formatted);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/cases/:id', async (req, res) => {
  try {
    const caseId = req.params.id;

    // 1) Core case + patient + doctor + department + assessment using view
    const dashboardResult = await query(
      `
        SELECT
          caserequestid,
          casestatus,
          urgency,
          casesummary,
          isadmitted,
          admittedon,
          dischargedon,
          casecreatedon,
          patientid,
          patientname,
          dateofbirth,
          gender,
          bloodgroup,
          patientphone,
          doctoremployeeid,
          doctorname,
          specialization,
          department,
          roomnumber,
          roomtype,
          symptoms,
          condition,
          temperature,
          systolicbp,
          diastolicbp,
          pulserate,
          oxygenlevel,
          bloodsugar,
          assessedon
        FROM vw_doctor_case_dashboard
        WHERE caserequestid = $1
      `,
      [caseId]
    );

    if (dashboardResult.rows.length === 0) {
      // Fallback to avoid breaking the UI in case of view/filter mismatch.
      const fallbackCase = await query(
        `
          SELECT cr.*, p.firstname, p.lastname, p.gender, p.bloodgroup, p.dateofbirth, p.phonenumber
          FROM caserequest cr
          JOIN patient p ON cr.patientid = p.patientid
          WHERE cr.caserequestid = $1
        `,
        [caseId]
      );
      if (fallbackCase.rows.length === 0) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const caseData = fallbackCase.rows[0];
      const formattedCase = {
        ...caseData,
        status: caseData.status,
        patient: {
          firstname: caseData.firstname,
          lastname: caseData.lastname,
          gender: caseData.gender,
          bloodgroup: caseData.bloodgroup,
          dateofbirth: caseData.dateofbirth,
          phonenumber: caseData.phonenumber,
        },
      };

      const assessmentResult = await query(
        `
          SELECT *
          FROM patientassessment
          WHERE patientid = $1
          ORDER BY assessedon DESC
        `,
        [caseData.patientid]
      );
      formattedCase.patientassessment = assessmentResult.rows;

      const diagnosisResult = await query(
        `
          SELECT diseaseid, diseasename, icd10code, severity, diagnosisnotes as notes, diagnosedon
          FROM vw_doctor_diagnosis
          WHERE caserequestid = $1
          ORDER BY diagnosedon DESC
        `,
        [caseId]
      );
      formattedCase.diagnosis = diagnosisResult.rows.map(
        mapDoctorDiagnosisRowToUi
      );

      const prescriptionResult = await query(
        `
          SELECT prescriptionid, medicines, instructions, prescribedon
          FROM vw_doctor_prescription
          WHERE caserequestid = $1
          ORDER BY prescribedon DESC
        `,
        [caseId]
      );
      formattedCase.prescription = prescriptionResult.rows.map(
        mapDoctorPrescriptionRowToUi
      );

      return res.json(formattedCase);
    }

    const row = dashboardResult.rows[0];

    const patientNameParts = splitDoctorName(row.patientname);
    const doctorNameParts = splitDoctorName(row.doctorname);

    const formattedCase = {
      caserequestid: row.caserequestid,
      patientid: row.patientid,
      status: row.casestatus,
      urgency: row.urgency,
      casesummary: row.casesummary,
      isadmitted: row.isadmitted,
      admittedon: row.admittedon,
      dischargedon: row.dischargedon,
      createdon: row.casecreatedon,
      doctoremployeeid: row.doctoremployeeid,
      roomid: row.roomnumber, // view provides roomnumber, UI displays it as "Room ID"

      firstname: patientNameParts.firstname,
      lastname: patientNameParts.lastname,
      gender: row.gender,
      bloodgroup: row.bloodgroup,
      dateofbirth: row.dateofbirth,
      phonenumber: row.patientphone,

      patient: {
        firstname: patientNameParts.firstname,
        lastname: patientNameParts.lastname,
        gender: row.gender,
        bloodgroup: row.bloodgroup,
        dateofbirth: row.dateofbirth,
        phonenumber: row.patientphone,
      },

      department: { name: row.department },
      doctor: {
        firstname: doctorNameParts.firstname,
        lastname: doctorNameParts.lastname,
        specialization: row.specialization,
      },

      // Views provide a single assessment row for this case; wrap it as an array.
      patientassessment: [
        {
          symptoms: row.symptoms,
          condition: row.condition,
          temperature: row.temperature,
          systolicbp: row.systolicbp,
          diastolicbp: row.diastolicbp,
          pulserate: row.pulserate,
          oxygenlevel: row.oxygenlevel,
          bloodsugar: row.bloodsugar,
          assessedon: row.assessedon,
          notes: null,
        },
      ],
    };

    // 2) Diagnosis/prescription from DB views
    const diagnosisResult = await query(
      `
        SELECT
          diseaseid,
          diseasename,
          icd10code,
          severity,
          diagnosisnotes AS notes,
          diagnosedon
        FROM vw_doctor_diagnosis
        WHERE caserequestid = $1
        ORDER BY diagnosedon DESC
      `,
      [caseId]
    );
    formattedCase.diagnosis = diagnosisResult.rows.map(
      mapDoctorDiagnosisRowToUi
    );

    const prescriptionResult = await query(
      `
        SELECT
          prescriptionid,
          medicines,
          instructions,
          prescribedon
        FROM vw_doctor_prescription
        WHERE caserequestid = $1
        ORDER BY prescribedon DESC
      `,
      [caseId]
    );
    formattedCase.prescription = prescriptionResult.rows.map(
      mapDoctorPrescriptionRowToUi
    );

    res.json(formattedCase);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/cases/patient/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT caserequestid, casestatus as status, urgency, casesummary, isadmitted, 
             admittedon, dischargedon, casedate as createdon, department as department_name, doctorname
      FROM vw_patient_medical_history 
      WHERE patientid = $1 
      ORDER BY casedate DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/cases/:id/status', async (req, res) => {
  try {
    const { status, remarks, doctoremployeeid } = req.body;
    const caseId = req.params.id;

    // Use Database Function for Case Acceptance
    if (status === 'Accepted' && doctoremployeeid) {
      const result = await query('SELECT * FROM fn_accept_reject_case($1, $2, $3)', [caseId, doctoremployeeid, 'Accept']);
      return res.json({ caserequestid: caseId, status: 'Accepted', message: result.rows[0].message });
    } else if (status === 'Open' && remarks && remarks.includes('Reject')) {
      const reason = remarks.replace('Rejected: ', '') || 'No reason provided';
      if (doctoremployeeid) {
        const result = await query('SELECT * FROM fn_accept_reject_case($1, $2, $3, $4)', [caseId, doctoremployeeid, 'Reject', reason]);
        return res.json({ caserequestid: caseId, status: 'Open', message: result.rows[0].message });
      }
    }

    const fields = ['status', 'remarks', 'doctoremployeeid'];
    let updatePairs = [];
    let values = [];
    let idx = 1;

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updatePairs.push(`${field} = $${idx++}`);
        values.push(req.body[field]);
      }
    });

    if (updatePairs.length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    values.push(caseId);
    const sql = `UPDATE caserequest SET ${updatePairs.join(', ')} WHERE caserequestid = $${idx} RETURNING *`;

    const result = await query(sql, values);
    if (!result.rows[0]) return res.status(404).json({ message: 'Case not found' });

    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/cases/diagnosis', async (req, res) => {
  try {
    const { caserequestid, diseaseid, severity, notes } = req.body;

    // Get the assigned doctor for this case
    const caseRes = await query('SELECT doctoremployeeid FROM caserequest WHERE caserequestid = $1', [caserequestid]);
    if (caseRes.rows.length === 0 || !caseRes.rows[0].doctoremployeeid) {
      return res.status(400).json({ error: 'Case not found or no doctor assigned.' });
    }
    const doctoremployeeid = caseRes.rows[0].doctoremployeeid;

    // Call the database function
    const result = await query(
      `SELECT * FROM fn_add_diagnosis($1, $2, $3, $4, $5)`,
      [caserequestid, diseaseid, severity, notes, doctoremployeeid]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/cases/prescription', async (req, res) => {
  try {
    const { caserequestid, medicines, instructions } = req.body;
    const result = await query(
      `INSERT INTO prescription (caserequestid, medicines, instructions) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (caserequestid) 
       DO UPDATE SET medicines = EXCLUDED.medicines, instructions = EXCLUDED.instructions
       RETURNING *`,
      [caserequestid, medicines, instructions]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- LAB TESTS & REPORTS ---
router.get('/lab-tests/catalog', async (req, res) => {
  try {
    const result = await query('SELECT * FROM labtest ORDER BY testname ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/lab-tests/queue', async (req, res) => {
  try {
    let sql = `
      SELECT lr.*, lt.testname, lt.testcode, lt.unit, lt.normalrange, p.firstname, p.lastname, cr.assigneddeptid, d.name as department_name
      FROM labreport lr
      JOIN labtest lt ON lr.labtestid = lt.labtestid
      JOIN patient p ON lr.patientid = p.patientid
      JOIN caserequest cr ON lr.caserequestid = cr.caserequestid
      JOIN department d ON cr.assigneddeptid = d.departmentid
      WHERE lr.status = 'Ordered'
    `;
    const params = [];
    if (req.query.assigneddeptid) {
      sql += ` AND cr.assigneddeptid = $1`;
      params.push(req.query.assigneddeptid);
    }
    sql += ' ORDER BY lr.orderedon ASC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/lab-tests/case/:id', async (req, res) => {
  try {
    // Using vw_doctor_lab_reports view
    const result = await query(`
      SELECT reportid, caserequestid, labtestid, testname, testcode, unit, normalrange,
             testvalue, labstatus as status, orderedon, resultedon,
             orderedby, performedby
      FROM vw_doctor_lab_reports
      WHERE caserequestid = $1
      ORDER BY orderedon DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/lab-tests', async (req, res) => {
  try {
    const { caserequestid, labtestid, orderedbyid } = req.body;
    const result = await query(
      `SELECT * FROM fn_order_lab_test($1, $2, $3)`,
      [caserequestid, labtestid, orderedbyid]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/lab-tests/:id', async (req, res) => {
  try {
    const { testvalue, performedbyid } = req.body;
    const reportId = req.params.id;

    const result = await query(
      `SELECT * FROM fn_nurse_fill_lab_report($1, $2, $3)`,
      [reportId, performedbyid, testvalue]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Server Lab Error:', err);
    res.status(500).json({
      error: err.message,
      sqlState: err.code,
      detail: 'If this is a constraint error, please check the console or types.'
    });
  }
});

// --- APPOINTMENTS ---
router.get('/appointments', async (req, res) => {
  try {
    const result = await query('SELECT * FROM appointment ORDER BY appointmentdate ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/appointments/doctor/:id', async (req, res) => {
  try {
    const { date } = req.query;
    let sql = `
      SELECT a.*, 
        p.firstname as patient_firstname, p.lastname as patient_lastname, p.phonenumber as patient_phone,
        e.firstname as doctor_firstname, e.lastname as doctor_lastname
      FROM appointment a
      JOIN patient p ON a.patientid = p.patientid
      JOIN employee e ON a.doctoremployeeid = e.employeeid
      WHERE a.doctoremployeeid = $1
    `;
    let params = [req.params.id];
    if (date) {
      sql += ' AND a.appointmentdate = $2';
      params.push(date);
    }
    sql += ' ORDER BY a.appointmentdate ASC, a.starttime ASC';
    const result = await query(sql, params);
    const formatted = result.rows.map(row => ({
      ...row,
      patient: { firstname: row.patient_firstname, lastname: row.patient_lastname, phone: row.patient_phone },
      doctor: { firstname: row.doctor_firstname, lastname: row.doctor_lastname }
    }));
    res.json(formatted);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/appointments/patient/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*,
        p.firstname as patient_firstname, p.lastname as patient_lastname,
        e.firstname as doctor_firstname, e.lastname as doctor_lastname,
        dp.specialization as doctor_specialization
      FROM appointment a
      JOIN patient p ON a.patientid = p.patientid
      JOIN employee e ON a.doctoremployeeid = e.employeeid
      LEFT JOIN doctorprofile dp ON e.employeeid = dp.employeeid
      WHERE a.patientid = $1
      ORDER BY a.appointmentdate DESC, a.starttime ASC
    `, [req.params.id]);
    const formatted = result.rows.map(row => ({
      ...row,
      patient: { firstname: row.patient_firstname, lastname: row.patient_lastname },
      doctor: { firstname: row.doctor_firstname, lastname: row.doctor_lastname, specialization: row.doctor_specialization }
    }));
    res.json(formatted);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/appointments', async (req, res) => {
  try {
    const { caserequestid, patientid, doctoremployeeid, createdbyempid, appointmentdate, starttime, endtime, type } = req.body;
    const result = await query(
      `INSERT INTO appointment (caserequestid, patientid, doctoremployeeid, createdbyempid, appointmentdate, starttime, endtime, type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [caserequestid, patientid, doctoremployeeid, createdbyempid, appointmentdate, starttime, endtime, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await query('UPDATE appointment SET status = $1 WHERE appointmentid = $2 RETURNING *', [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
