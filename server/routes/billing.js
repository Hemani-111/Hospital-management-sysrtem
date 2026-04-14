import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// --- BILLING ---

router.get('/unbilled-cases', async (req, res) => {
  try {
    const result = await query(`
      SELECT cr.caserequestid, cr.casesummary, cr.createdon, cr.status, p.firstname, p.lastname
      FROM caserequest cr
      JOIN patient p ON cr.patientid = p.patientid
      LEFT JOIN bill b ON cr.caserequestid = b.caserequestid
      WHERE cr.status = 'Resolved' AND b.billid IS NULL
      ORDER BY cr.createdon DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/generate/:id', async (req, res) => {
  try {
    const caseId = req.params.id;

    const result = await query(`SELECT * FROM fn_generate_bill($1)`, [caseId]);
    
    // In order to return the full bill object to the frontend, query the bill table
    const billId = result.rows[0].bill_id;
    const finalBill = await query('SELECT * FROM bill WHERE billid = $1', [billId]);

    res.status(201).json(finalBill.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT b.*, 
        cr.patientid, cr.casesummary, cr.createdon as case_created_on,
        p.firstname as patient_firstname, p.lastname as patient_lastname,
        d.name as dept_name
      FROM bill b
      JOIN caserequest cr ON b.caserequestid = cr.caserequestid
      JOIN patient p ON cr.patientid = p.patientid
      LEFT JOIN department d ON cr.assigneddeptid = d.departmentid
      ORDER BY b.generatedon DESC
    `);
    
    // Format for frontend expectation (nested caserequest -> patient)
    const formatted = result.rows.map(row => ({
      ...row,
      caserequest: {
        caserequestid: row.caserequestid,
        casesummary: row.casesummary,
        createdon: row.case_created_on,
        patient: {
          patientid: row.patientid,
          firstname: row.patient_firstname,
          lastname: row.patient_lastname
        },
        department: { name: row.dept_name }
      }
    }));
    res.json(formatted);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/patient/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT b.* 
      FROM bill b
      JOIN caserequest cr ON b.caserequestid = cr.caserequestid
      WHERE cr.patientid = $1
      ORDER BY b.generatedon DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM bill WHERE billid = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await query('UPDATE bill SET paymentstatus = $1 WHERE billid = $2 RETURNING *', [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const updates = Object.keys(req.body).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const vals = [...Object.values(req.body), req.params.id];
    const result = await query(`UPDATE patient SET ${updates} WHERE patientid = $${vals.length} RETURNING *`, vals);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
