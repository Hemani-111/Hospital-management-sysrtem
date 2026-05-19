import express from 'express';
import { query } from '../db.js';
import {
  mapDoctorDiagnosisRowToUi,
  mapDoctorPrescriptionRowToUi,
  mapPatientLabReportRowToUi,
  splitDoctorName,
} from '../utils/viewMappers.js';

const router = express.Router();

const toEmptyArrayIfNull = (v) => (Array.isArray(v) ? v : []);

// --- PATIENTS ---
router.get('/', async (req, res) => {
  try {
    const { unassessed } = req.query;
    let sql = `
      SELECT p.*, cr.caserequestid, cr.status as case_status, cr.isadmitted, r.roomnumber,
             ins.providername as insurance_provider, pi.policynumber as insurance_policy,
             ins.maxcoverageamount as insurance_coverage
      FROM patient p
      LEFT JOIN caserequest cr ON p.patientid = cr.patientid AND cr.status != 'Resolved'
      LEFT JOIN room r ON cr.roomid = r.roomid
      LEFT JOIN patientinsurance pi ON p.patientid = pi.patientid
      LEFT JOIN insurance ins ON pi.insuranceid = ins.insuranceid
    `;
    if (unassessed === 'true') {
      sql += ' WHERE p.patientid NOT IN (SELECT patientid FROM patientassessment)';
    }
    sql += ' ORDER BY p.createdon DESC';
    const result = await query(sql);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, ins.providername as insurance_provider, pi.policynumber as insurance_policy,
             ins.maxcoverageamount as insurance_coverage
      FROM patient p
      LEFT JOIN patientinsurance pi ON p.patientid = pi.patientid
      LEFT JOIN insurance ins ON pi.insuranceid = ins.insuranceid
      WHERE p.patientid = $1
    `, [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/profile/:userId', async (req, res) => {
  try {
    const result = await query('SELECT * FROM patient WHERE userid = $1', [req.params.userId]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/email/:email', async (req, res) => {
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

router.post('/', async (req, res) => {
  try {
    const {
      firstname, lastname, dateofbirth, gender, phonenumber, emergencycontact,
      bloodgroup, height, weight, addressline1, addressline2, city, state, postalcode, country, createdbyadminid
    } = req.body;

    // Check if we have minimal required fields for the function
    if (!firstname || !lastname || !dateofbirth || !phonenumber || !emergencycontact || !city || !state) {
      // Fallback for simple inserts if frontend is not sending full profile initially
      const cols = Object.keys(req.body).join(', ');
      const vals = Object.values(req.body);
      const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
      const result = await query(`INSERT INTO patient (${cols}) VALUES (${placeholders}) RETURNING *`, vals);
      return res.status(201).json(result.rows[0]);
    }

    const result = await query(
      `SELECT * FROM fn_register_patient($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        firstname, lastname, dateofbirth, gender, phonenumber, emergencycontact,
        bloodgroup, height || null, weight || null, addressline1 || '', addressline2 || '',
        city, state, postalcode || '', country || 'India', createdbyadminid || 1
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Patient Registration Error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updates = Object.keys(req.body).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const vals = [...Object.values(req.body), req.params.id];
    const result = await query(`UPDATE patient SET ${updates} WHERE patientid = $${vals.length} RETURNING *`, vals);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM patient WHERE patientid = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/verify-code/:code', async (req, res) => {
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

// --- ASSESSMENTS ---
router.get('/assessments/all', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        pa.*,
        p.firstname as patient_firstname, p.lastname as patient_lastname,
        e.firstname as nurse_firstname, e.lastname as nurse_lastname
      FROM patientassessment pa
      JOIN patient p ON pa.patientid = p.patientid
      JOIN employee e ON pa.nurseemployeeid = e.employeeid
      ORDER BY pa.assessedon DESC
    `);

    // Map to nested structure for frontend
    const mapped = result.rows.map(row => ({
      ...row,
      patient: { firstname: row.patient_firstname, lastname: row.patient_lastname },
      employee: { firstname: row.nurse_firstname, lastname: row.nurse_lastname }
    }));

    res.json(mapped);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/assessments/pending', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM vw_open_cases_by_dept`);
    // Map view columns to what frontend expects from raw query
    const mapped = result.rows.map(r => ({
      ...r,
      caserequestid: r.caserequestid,
      patientid: r.patientid,
      assigneddeptid: r.departmentid,
      casesummary: r.casesummary,
      urgency: r.urgency,
      status: r.casestatus,
      createdon: r.casecreatedon,
      firstname: r.patientname.split(' ')[0] || r.patientname,
      lastname: r.patientname.split(' ').slice(1).join(' ') || ''
    }));
    res.json(mapped);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/assessments', async (req, res) => {
  try {
    const {
      patientid, nurseemployeeid, symptoms, condition,
      temperature, systolicbp, diastolicbp, pulserate, oxygenlevel, bloodsugar, notes,
      assignedDeptID, urgency, caseSummary
    } = req.body;

    if (assignedDeptID) {
      const result = await query(
        `SELECT * FROM fn_create_case_request($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          patientid, nurseemployeeid, symptoms, condition,
          temperature, systolicbp, diastolicbp, pulserate, oxygenlevel, bloodsugar, notes,
          assignedDeptID, urgency || 'Routine', caseSummary || symptoms
        ]
      );

      res.status(201).json({
        assessment: { assessmentid: result.rows[0].assessment_id },
        caseRequest: { caserequestid: result.rows[0].case_request_id },
        message: result.rows[0].message
      });
    } else {
      // Just assessment
      const assessmentResult = await query(
        `INSERT INTO patientassessment 
          (patientid, nurseemployeeid, symptoms, condition, temperature, systolicbp, diastolicbp, pulserate, oxygenlevel, bloodsugar, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [patientid, nurseemployeeid, symptoms, condition, temperature, systolicbp, diastolicbp, pulserate, oxygenlevel, bloodsugar, notes]
      );
      res.status(201).json({ assessment: assessmentResult.rows[0] });
    }
  } catch (err) {
    console.error('Assessment Creation Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- FEEDBACK ---
router.get('/feedback/staff-to-rate/:patientId', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        cr.caserequestid, cr.casesummary, cr.status, cr.createdon,
        doc.employeeid AS doctor_id, doc.firstname AS doctor_firstname, doc.lastname AS doctor_lastname,
        dp.specialization AS doctor_specialization,
        nur.employeeid AS nurse_id, nur.firstname AS nurse_firstname, nur.lastname AS nurse_lastname
      FROM caserequest cr
      LEFT JOIN employee doc ON cr.doctoremployeeid = doc.employeeid
      LEFT JOIN doctorprofile dp ON doc.employeeid = dp.employeeid
      LEFT JOIN employee nur ON cr.nurseemployeeid = nur.employeeid
      WHERE cr.patientid = $1
        AND cr.status = 'Resolved'
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

router.get('/feedback/patient/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM feedback WHERE patientid = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/feedback', async (req, res) => {
  try {
    const { patientid, employeeid, caserequestid, rating, comment } = req.body;
    if (!patientid || !employeeid || !caserequestid || !rating) {
      return res.status(400).json({ error: 'patientid, employeeid, caserequestid, and rating are required.' });
    }
    const result = await query(
      `SELECT * FROM fn_submit_feedback($1, $2, $3, $4, $5)`,
      [patientid, employeeid, caserequestid, rating, comment || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: err.message });
  }
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
    const patientId = req.params.id;

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
    `, [patientId]);

    const cases = result.rows;
    if (!cases.length) return res.json([]);

    // Views: attach diagnosis/prescription/lab arrays for each case
    const caseIds = cases.map((c) => c.caserequestid);

    const diagnosisResult = await query(
      `
        SELECT
          caserequestid,
          diseaseid,
          diseasename,
          icd10code,
          severity,
          diagnosisnotes AS notes,
          diagnosedon
        FROM vw_doctor_diagnosis
        WHERE patientid = $1
        AND caserequestid = ANY($2)
        ORDER BY diagnosedon DESC
      `,
      [patientId, caseIds]
    );

    const prescriptionResult = await query(
      `
        SELECT
          caserequestid,
          prescriptionid,
          medicines,
          instructions,
          prescribedon
        FROM vw_doctor_prescription
        WHERE patientid = $1
        AND caserequestid = ANY($2)
        ORDER BY prescribedon DESC
      `,
      [patientId, caseIds]
    );

    const labResult = await query(
      `
        SELECT
          reportid,
          caserequestid,
          labstatus,
          orderedon,
          resultedon,
          testvalue,
          testname,
          unit,
          normalrange
        FROM vw_patient_lab_report
        WHERE patientid = $1
        AND caserequestid = ANY($2)
        ORDER BY orderedon DESC
      `,
      [patientId, caseIds]
    );

    const diagnosisByCaseId = diagnosisResult.rows.reduce((acc, row) => {
      const cid = row.caserequestid;
      if (!acc[cid]) acc[cid] = [];
      acc[cid].push(mapDoctorDiagnosisRowToUi(row));
      return acc;
    }, {});

    const prescriptionByCaseId = prescriptionResult.rows.reduce((acc, row) => {
      const cid = row.caserequestid;
      if (!acc[cid]) acc[cid] = [];
      acc[cid].push(mapDoctorPrescriptionRowToUi(row));
      return acc;
    }, {});

    const labByCaseId = labResult.rows.reduce((acc, row) => {
      const cid = row.caserequestid;
      if (!acc[cid]) acc[cid] = [];
      acc[cid].push(mapPatientLabReportRowToUi(row));
      return acc;
    }, {});

    res.json(
      cases.map((row) => ({
        ...row,
        department: { name: row.department_name },
        doctor: row.doctor_firstname
          ? {
            firstname: row.doctor_firstname,
            lastname: row.doctor_lastname,
            specialization: row.doctor_specialization,
          }
          : null,
        diagnosis: toEmptyArrayIfNull(diagnosisByCaseId[row.caserequestid]).sort(
          (a, b) => new Date(b.diagnosedon ?? 0) - new Date(a.diagnosedon ?? 0)
        ),
        prescription: toEmptyArrayIfNull(
          prescriptionByCaseId[row.caserequestid]
        ),
        labreport: toEmptyArrayIfNull(labByCaseId[row.caserequestid]),
      }))
    );
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/portal/bills/:id', async (req, res) => {
  try {
    const result = await query(
      `
        SELECT DISTINCT ON (billid)
          billid,
          totalamount,
          discount,
          insurancecovered,
          paymentstatus,
          paymentmethod,
          generatedon,
          paidon
        FROM vw_patient_appointments_bills
        WHERE patientid = $1
          AND billid IS NOT NULL
        ORDER BY billid, generatedon DESC
      `,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/portal/appointments/:id', async (req, res) => {
  try {
    const result = await query(
      `
        SELECT DISTINCT ON (appointmentid)
          appointmentid,
          appointmentdate,
          starttime,
          endtime,
          appointmenttype,
          appointmentstatus AS status,
          doctorname,
          specialization
        FROM vw_patient_appointments_bills
        WHERE patientid = $1
          AND appointmentid IS NOT NULL
        ORDER BY appointmentid, appointmentdate DESC, starttime ASC
      `,
      [req.params.id]
    );

    res.json(
      result.rows.map((row) => {
        const { firstname, lastname } = splitDoctorName(row.doctorname);
        return {
          ...row,
          doctor: {
            firstname,
            lastname,
            specialization: row.specialization,
          },
        };
      })
    );
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/portal/lab-reports/:id', async (req, res) => {
  try {
    const result = await query(
      `
        SELECT
          reportid,
          caserequestid,
          labstatus,
          orderedon,
          resultedon,
          testvalue,
          testname,
          unit,
          normalrange
        FROM vw_patient_lab_report
        WHERE patientid = $1
        ORDER BY orderedon DESC
      `,
      [req.params.id]
    );

    res.json(result.rows.map(mapPatientLabReportRowToUi));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ADMIN PATIENT INSPECTION ---
router.get('/:id/cases', async (req, res) => {
  try {
    const result = await query(`
      SELECT cr.*, d.name as department_name, e.firstname as doctor_firstname, e.lastname as doctor_lastname
      FROM caserequest cr
      LEFT JOIN department d ON cr.assigneddeptid = d.departmentid
      LEFT JOIN employee e ON cr.doctoremployeeid = e.employeeid
      WHERE cr.patientid = $1
      ORDER BY cr.createdon DESC
    `, [req.params.id]);
    res.json(result.rows.map(row => ({
      ...row,
      department: { name: row.department_name },
      doctor: row.doctor_firstname ? { firstname: row.doctor_firstname, lastname: row.doctor_lastname } : null
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/assessments', async (req, res) => {
  try {
    const result = await query(`
      SELECT pa.*, e.firstname as nurse_firstname, e.lastname as nurse_lastname
      FROM patientassessment pa
      LEFT JOIN employee e ON pa.nurseemployeeid = e.employeeid
      WHERE pa.patientid = $1
      ORDER BY pa.assessmentdate DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
