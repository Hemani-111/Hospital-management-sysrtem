import express from 'express';
import { query } from './db.js';

const router = express.Router();

// --- DISEASES ---
router.get('/diseases', async (req, res) => {
  try {
    const result = await query('SELECT * FROM disease ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PATIENTS ---
router.get('/patients', async (req, res) => {
  try {
    const { unassessed } = req.query;
    let sql = 'SELECT * FROM patient';
    if (unassessed === 'true') {
      sql += ' WHERE patientid NOT IN (SELECT patientid FROM patientassessment)';
    }
    sql += ' ORDER BY createdon DESC';
    const result = await query(sql);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/patients/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM patient WHERE patientid = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/patients/profile/:userId', async (req, res) => {
  try {
    const result = await query('SELECT * FROM patient WHERE userid = $1', [req.params.userId]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/patients/email/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const pResult = await query(`
      SELECT p.*, u.email 
      FROM patient p 
      JOIN users u ON p.userid = u.userid 
      WHERE u.email = $1
    `, [email]);

    const patient = pResult.rows[0];
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Fetch insurance details
    const iResult = await query(`
      SELECT pi.*, i.providername, i.planname 
      FROM patientinsurance pi 
      JOIN insurance i ON pi.insuranceid = i.insuranceid 
      WHERE pi.patientid = $1
    `, [patient.patientid]);

    patient.patientinsurance = iResult.rows.map(row => ({
      ...row,
      insurance: { providername: row.providername, planname: row.planname }
    }));

    res.json(patient);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/patients', async (req, res) => {
  try {
    const cols = Object.keys(req.body).join(', ');
    const vals = Object.values(req.body);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
    const result = await query(`INSERT INTO patient (${cols}) VALUES (${placeholders}) RETURNING *`, vals);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/patients/:id', async (req, res) => {
  try {
    const updates = Object.keys(req.body).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const vals = [...Object.values(req.body), req.params.id];
    const result = await query(`UPDATE patient SET ${updates} WHERE patientid = $${vals.length} RETURNING *`, vals);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/patients/:id', async (req, res) => {
  try {
    await query('DELETE FROM patient WHERE patientid = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/patients/verify-code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await query(
      'SELECT patientid, firstname, lastname, signupcode, isregistered, userid FROM patient WHERE signupcode = $1',
      [code]
    );
    const data = result.rows[0];
    if (!data) return res.status(404).json({ message: 'Invalid signup code.' });
    if (data.isregistered || data.userid) return res.status(400).json({ message: 'Already used.' });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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
    
    // 1. Get Case + Patient
    const caseResult = await query(`
      SELECT cr.*, p.firstname, p.lastname, p.gender, p.bloodgroup, p.dateofbirth, p.phonenumber
      FROM caserequest cr
      JOIN patient p ON cr.patientid = p.patientid
      WHERE cr.caserequestid = $1
    `, [caseId]);
    
    if (caseResult.rows.length === 0) return res.status(404).json({ error: 'Case not found' });
    
    const caseData = caseResult.rows[0];
    const formattedCase = {
      ...caseData,
      patient: { 
        firstname: caseData.firstname, 
        lastname: caseData.lastname, 
        gender: caseData.gender, 
        bloodgroup: caseData.bloodgroup, 
        dateofbirth: caseData.dateofbirth,
        phonenumber: caseData.phonenumber
      }
    };
    
    // 2. Get Assessments (Vitals)
    const assessmentResult = await query('SELECT * FROM patientassessment WHERE patientid = $1 ORDER BY assessedon DESC', [caseData.patientid]);
    formattedCase.patientassessment = assessmentResult.rows;
    
    // 3. Get Diagnosis
    const diagnosisResult = await query('SELECT * FROM diagnosis WHERE caserequestid = $1 ORDER BY diagnosedon DESC', [caseId]);
    formattedCase.diagnosis = diagnosisResult.rows;
    
    // 4. Get Prescription
    const prescriptionResult = await query('SELECT * FROM prescription WHERE caserequestid = $1 ORDER BY prescribedon DESC', [caseId]);
    formattedCase.prescription = prescriptionResult.rows;
    
    res.json(formattedCase);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/cases/patient/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM caserequest WHERE patientid = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/cases/:id/status', async (req, res) => {
  try {
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

    values.push(req.params.id);
    const sql = `UPDATE caserequest SET ${updatePairs.join(', ')} WHERE caserequestid = $${idx} RETURNING *`;
    
    const result = await query(sql, values);
    if (!result.rows[0]) return res.status(404).json({ message: 'Case not found' });
    
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/cases/diagnosis', async (req, res) => {
  try {
    const { caserequestid, diseaseid, severity, notes } = req.body;
    const result = await query(
      `INSERT INTO diagnosis (caserequestid, diseaseid, severity, notes) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (caserequestid, diseaseid) 
       DO UPDATE SET severity = EXCLUDED.severity, notes = EXCLUDED.notes
       RETURNING *`,
      [caserequestid, diseaseid, severity, notes]
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
    const result = await query(`
      SELECT lr.*, lt.testname, lt.testcode, lt.unit, lt.normalrange, e.firstname as perf_first, e.lastname as perf_last
      FROM labreport lr
      JOIN labtest lt ON lr.labtestid = lt.labtestid
      LEFT JOIN employee e ON lr.performedbyid = e.employeeid
      WHERE lr.caserequestid = $1
      ORDER BY lr.orderedon DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/lab-tests', async (req, res) => {
  try {
    const { caserequestid, labtestid, patientid, orderedbyid } = req.body;
    const result = await query(
      'INSERT INTO labreport (caserequestid, labtestid, patientid, orderedbyid, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [caserequestid, labtestid, patientid, orderedbyid, 'Ordered']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/lab-tests/:id', async (req, res) => {
  try {
    const { testvalue, performedbyid, resultedon } = req.body;
    const result = await query(
      'UPDATE labreport SET testvalue = $1, performedbyid = $2, resultedon = $3, status = $4 WHERE reportid = $5 RETURNING *',
      [testvalue, performedbyid, resultedon, 'Completed', req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ROOMS & ADMISSION ---
router.get('/rooms/available', async (req, res) => {
  try {
    const result = await query('SELECT * FROM room WHERE isoccupied = FALSE ORDER BY roomnumber ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/cases/:id/admit', async (req, res) => {
  try {
    const { roomid } = req.body;
    await query('BEGIN');
    const caseResult = await query(
      'UPDATE caserequest SET isadmitted = TRUE, roomid = $1, admittedon = NOW() WHERE caserequestid = $2 RETURNING *',
      [roomid, req.params.id]
    );
    await query('UPDATE room SET isoccupied = TRUE WHERE roomid = $1', [roomid]);
    await query('COMMIT');
    res.json(caseResult.rows[0]);
  } catch (err) {
    await query('ROLLBACK');
    res.status(500).json({ error: err.message });
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

// --- DEPARTMENTS ---
router.get('/departments', async (req, res) => {
  try {
    const result = await query('SELECT * FROM department ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ROOMS ---
router.get('/rooms', async (req, res) => {
  try {
    const result = await query('SELECT * FROM room ORDER BY roomnumber ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/rooms/stats', async (req, res) => {
  try {
    const result = await query('SELECT isoccupied FROM room');
    const total = result.rows.length;
    const occupied = result.rows.filter(r => r.isoccupied).length;
    res.json({ total, occupied, available: total - occupied });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/rooms/:id/occupancy', async (req, res) => {
  try {
    const { isOccupied } = req.body;
    const result = await query('UPDATE room SET isoccupied = $1 WHERE roomid = $2 RETURNING *', [isOccupied, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/rooms', async (req, res) => {
  try {
    const { roomnumber, type, departmentid, pricepernight } = req.body;
    const result = await query(
      'INSERT INTO room (roomnumber, type, departmentid, pricepernight) VALUES ($1, $2, $3, $4) RETURNING *',
      [roomnumber, type, departmentid, pricepernight]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/rooms/:id', async (req, res) => {
  try {
    const { roomnumber, type, departmentid, pricepernight, isoccupied } = req.body;
    const result = await query(
      'UPDATE room SET roomnumber = $1, type = $2, departmentid = $3, pricepernight = $4, isoccupied = $5 WHERE roomid = $6 RETURNING *',
      [roomnumber, type, departmentid, pricepernight, isoccupied, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- BILLING ---
router.get('/billing', async (req, res) => {
  try {
    const result = await query('SELECT * FROM bill ORDER BY generatedon DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/billing/patient/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM bill WHERE patientid = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/billing/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM bill WHERE billid = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/billing/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await query('UPDATE bill SET paymentstatus = $1 WHERE billid = $2 RETURNING *', [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/billing/:id', async (req, res) => {
  try {
    const updates = Object.keys(req.body).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const vals = [...Object.values(req.body), req.params.id];
    const result = await query(`UPDATE bill SET ${updates} WHERE billid = $${vals.length} RETURNING *`, vals);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ASSESSMENTS ---
router.get('/assessments', async (req, res) => {
  try {
    const result = await query('SELECT * FROM patientassessment ORDER BY assessedon DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/assessments/pending', async (req, res) => {
  try {
    // Logic: Patients in CaseRequest with status 'Open' that haven't been assessed yet? 
    // Or just all open cases.
    const result = await query(`
      SELECT cr.*, p.firstname, p.lastname 
      FROM caserequest cr
      JOIN patient p ON cr.patientid = p.patientid
      WHERE cr.status = 'Open'
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/assessments', async (req, res) => {
  try {
    const { 
      patientid, nurseemployeeid, symptoms, condition, 
      temperature, systolicbp, diastolicbp, pulserate, oxygenlevel, bloodsugar, notes,
      assignedDeptID, urgency, caseSummary
    } = req.body;

    await query('BEGIN');

    const assessmentResult = await query(
      `INSERT INTO patientassessment 
        (patientid, nurseemployeeid, symptoms, condition, temperature, systolicbp, diastolicbp, pulserate, oxygenlevel, bloodsugar, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [patientid, nurseemployeeid, symptoms, condition, temperature, systolicbp, diastolicbp, pulserate, oxygenlevel, bloodsugar, notes]
    );
    const assessment = assessmentResult.rows[0];

    let caseRequest = null;
    if (assignedDeptID) {
      // Get the admin who created the patient to tie to the case
      const patientResult = await query('SELECT createdbyadminid FROM patient WHERE patientid = $1', [patientid]);
      const createdByAdminId = patientResult.rows[0]?.createdbyadminid || 1; // Fallback to 1 if not found

      const caseResult = await query(
        `INSERT INTO caserequest 
          (patientid, assessmentid, assigneddeptid, nurseemployeeid, createdbyadminid, casesummary, urgency, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Open') RETURNING *`,
        [patientid, assessment.assessmentid, assignedDeptID, nurseemployeeid, createdByAdminId, caseSummary || symptoms, urgency || 'Routine']
      );
      caseRequest = caseResult.rows[0];
    }

    await query('COMMIT');
    res.status(201).json({ assessment, caseRequest });
  } catch (err) { 
    await query('ROLLBACK');
    res.status(500).json({ error: err.message }); 
  }
});

// GET /feedback/staff-to-rate/:patientId
// Returns cases grouped with doctor + nurse for rating
router.get('/feedback/staff-to-rate/:patientId', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        cr.caserequestid,
        cr.casesummary,
        cr.status,
        cr.createdon,
        doc.employeeid   AS doctor_id,
        doc.firstname    AS doctor_firstname,
        doc.lastname     AS doctor_lastname,
        dp.specialization AS doctor_specialization,
        nur.employeeid   AS nurse_id,
        nur.firstname    AS nurse_firstname,
        nur.lastname     AS nurse_lastname
      FROM caserequest cr
      LEFT JOIN employee doc ON cr.doctoremployeeid = doc.employeeid
      LEFT JOIN doctorprofile dp ON doc.employeeid = dp.employeeid
      LEFT JOIN employee nur ON cr.nurseemployeeid = nur.employeeid
      WHERE cr.patientid = $1
        AND (cr.doctoremployeeid IS NOT NULL OR cr.nurseemployeeid IS NOT NULL)
      ORDER BY cr.createdon DESC
    `, [req.params.patientId]);

    const formatted = result.rows.map(row => ({
      caserequestid: row.caserequestid,
      casesummary: row.casesummary,
      status: row.status,
      createdon: row.createdon,
      employee: row.doctor_id ? {
        employeeid: row.doctor_id,
        firstname: row.doctor_firstname,
        lastname: row.doctor_lastname,
        doctorprofile: { specialization: row.doctor_specialization }
      } : null,
      nurse: row.nurse_id ? {
        employeeid: row.nurse_id,
        firstname: row.nurse_firstname,
        lastname: row.nurse_lastname,
      } : null,
    }));

    res.json(formatted);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /feedback/patient/:patientId — existing feedback
router.get('/feedback/patient/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM feedback WHERE patientid = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /feedback — submit or update feedback
router.post('/feedback', async (req, res) => {
  try {
    const { patientid, employeeid, caserequestid, rating, comment } = req.body;
    if (!patientid || !employeeid || !caserequestid || !rating) {
      return res.status(400).json({ error: 'patientid, employeeid, caserequestid, and rating are required.' });
    }
    const result = await query(`
      INSERT INTO feedback (patientid, employeeid, caserequestid, rating, comment, createdon)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (patientid, caserequestid, employeeid)
      DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, createdon = NOW()
      RETURNING *
    `, [patientid, employeeid, caserequestid, rating, comment || '']);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PORTAL ---
router.get('/portal/profile/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM patient WHERE patientid = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/portal/profile/email/:email', async (req, res) => {
  try {
    const result = await query('SELECT p.* FROM patient p JOIN users u ON p.userid = u.userid WHERE u.email = $1', [req.params.email]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/portal/cases/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT cr.*, d.name as department_name,
        e.firstname as doctor_firstname, e.lastname as doctor_lastname,
        dp.specialization as doctor_specialization
      FROM caserequest cr
      LEFT JOIN department d ON cr.assigneddeptid = d.departmentid
      LEFT JOIN employee e ON cr.doctoremployeeid = e.employeeid
      LEFT JOIN doctorprofile dp ON e.employeeid = dp.employeeid
      WHERE cr.patientid = $1
      ORDER BY cr.createdon DESC
    `, [req.params.id]);
    const formatted = result.rows.map(row => ({
      ...row,
      department: { name: row.department_name },
      doctor: row.doctor_firstname ? { firstname: row.doctor_firstname, lastname: row.doctor_lastname, specialization: row.doctor_specialization } : null
    }));
    res.json(formatted);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/portal/bills/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM bill WHERE patientid = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/portal/appointments/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*,
        e.firstname as doctor_firstname, e.lastname as doctor_lastname,
        dp.specialization as doctor_specialization
      FROM appointment a
      JOIN employee e ON a.doctoremployeeid = e.employeeid
      LEFT JOIN doctorprofile dp ON e.employeeid = dp.employeeid
      WHERE a.patientid = $1
      ORDER BY a.appointmentdate DESC, a.starttime ASC
    `, [req.params.id]);
    const formatted = result.rows.map(row => ({
      ...row,
      doctor: { firstname: row.doctor_firstname, lastname: row.doctor_lastname, specialization: row.doctor_specialization }
    }));
    res.json(formatted);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/portal/lab-reports/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM labreport WHERE patientid = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


export default router;
