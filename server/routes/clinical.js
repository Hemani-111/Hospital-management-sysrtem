import express from 'express';
import { query } from '../db.js';

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
    const { testvalue, performedbyid } = req.body;
    const reportId = req.params.id;

    const result = await query(
      `UPDATE labreport 
       SET testvalue = $1, performedbyid = $2, resultedon = NOW(), status = 'Resulted'::lab_status 
       WHERE reportid = $3 RETURNING *`,
      [testvalue || null, performedbyid || null, reportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lab report not found' });
    }

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
