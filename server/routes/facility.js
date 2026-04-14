import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// --- DISEASES ---
router.get('/diseases', async (req, res) => {
  try {
    const result = await query('SELECT * FROM disease ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- DEPARTMENTS ---
router.get('/departments', async (req, res) => {
  try {
    const result = await query('SELECT * FROM department ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/departments/stats', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        d.departmentid, 
        d.name, 
        (SELECT COUNT(*) FROM employee e WHERE e.departmentid = d.departmentid) as staff_count,
        (SELECT COUNT(*) FROM caserequest cr WHERE cr.assigneddeptid = d.departmentid AND cr.status != 'Resolved') as case_count,
        (SELECT COUNT(*) FROM room r WHERE r.departmentid = d.departmentid) as bed_count
      FROM department d
      ORDER BY d.name
    `);
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

router.get('/rooms/available', async (req, res) => {
  try {
    const result = await query('SELECT * FROM room WHERE isoccupied = FALSE ORDER BY roomnumber ASC');
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

// --- ADMISSIONS ---
router.patch('/admissions/:id/admit', async (req, res) => {
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

router.patch('/admissions/:id/discharge', async (req, res) => {
  try {
    const { id } = req.params;
    await query('BEGIN');
    const caseResult = await query('SELECT roomid FROM caserequest WHERE caserequestid = $1', [id]);
    const roomId = caseResult.rows[0]?.roomid;

    await query(`
      UPDATE caserequest 
      SET isadmitted = FALSE, roomid = NULL, dischargedon = NOW() 
      WHERE caserequestid = $1
    `, [id]);

    if (roomId) {
      await query('UPDATE room SET isoccupied = FALSE WHERE roomid = $1', [roomId]);
    }

    await query('COMMIT');
    res.json({ message: 'Patient discharged successfully' });
  } catch (err) {
    await query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

export default router;
