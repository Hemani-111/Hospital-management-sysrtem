import express from 'express';
import { query } from './db.js';

const router = express.Router();

// Get all employees
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*, d.name as department_name 
      FROM employee e 
      LEFT JOIN department d ON e.departmentid = d.departmentid 
      ORDER BY e.firstname ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get doctors
router.get('/doctors', async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*, dp.specialization, d.name as department_name 
      FROM employee e 
      JOIN doctorprofile dp ON e.employeeid = dp.employeeid 
      LEFT JOIN department d ON e.departmentid = d.departmentid 
      WHERE e.employeetype = 'Doctor'
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get profile by email (used for dashboard initialization)
router.get('/profile/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const userResult = await query('SELECT userid FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(440).json({ message: 'User not found' });

    // 1. Get Employee & Department
    const empResult = await query(`
      SELECT e.*, d.name as department_name 
      FROM employee e 
      LEFT JOIN department d ON e.departmentid = d.departmentid 
      WHERE e.userid = $1
    `, [userResult.rows[0].userid]);

    const employee = empResult.rows[0];
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // 2. Get Doctor Profile separately
    const dpResult = await query('SELECT * FROM doctorprofile WHERE employeeid = $1', [employee.employeeid]);
    
    // 3. Construct Nested Object
    const responseData = {
      ...employee,
      department: { name: employee.department_name },
      doctorprofile: dpResult.rows[0] || null
    };

    res.json(responseData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update or Create Doctor Portfolio (Upsert)
router.post('/doctor', async (req, res) => {
  const { employeeid, specialization, qualification, experienceyears } = req.body;
  try {
    const result = await query(`
      INSERT INTO doctorprofile (employeeid, specialization, qualification, experienceyears, licensenumber)
      VALUES ($1, $2, $3, $4, 'PENDING-' || $1)
      ON CONFLICT (employeeid) 
      DO UPDATE SET 
        specialization = EXCLUDED.specialization,
        qualification = EXCLUDED.qualification,
        experienceyears = EXCLUDED.experienceyears
      RETURNING *
    `, [employeeid, specialization, qualification, experienceyears]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify employee number for self-registration (staff sign-up flow)
router.get('/verify/:idNumber', async (req, res) => {
  const { idNumber } = req.params;
  try {
    const result = await query(`
      SELECT e.*, d.name as department_name 
      FROM employee e 
      LEFT JOIN department d ON e.departmentid = d.departmentid 
      WHERE e.employeenumber = $1
    `, [idNumber.toUpperCase()]);

    const employee = result.rows[0];

    if (!employee) {
      return res.status(404).json({ message: 'Employee ID not found. Please contact your administrator.' });
    }

    if (employee.userid) {
      return res.status(400).json({ message: 'This Employee ID is already registered. Please login instead.' });
    }

    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Staff (Admin only feature in frontend)
router.post('/', async (req, res) => {
  const { profileData, doctorData } = req.body;
  try {
    // 1. Insert Employee
    const cols = Object.keys(profileData).join(', ');
    const vals = Object.values(profileData);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
    const empResult = await query(`INSERT INTO employee (${cols}) VALUES (${placeholders}) RETURNING *`, vals);
    const employee = empResult.rows[0];

    // 2. If Doctor, insert DoctorProfile
    if (doctorData && employee.employeetype === 'Doctor') {
      const dCols = ['employeeid', ...Object.keys(doctorData)].join(', ');
      const dVals = [employee.employeeid, ...Object.values(doctorData)];
      const dPlaceholders = dVals.map((_, i) => `$${i + 1}`).join(', ');
      await query(`INSERT INTO doctorprofile (${dCols}) VALUES (${dPlaceholders})`, dVals);
    }

    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get profile by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM employee WHERE employeeid = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const updates = Object.keys(req.body).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const vals = [...Object.values(req.body), req.params.id];
    const result = await query(`UPDATE employee SET ${updates} WHERE employeeid = $${vals.length} RETURNING *`, vals);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM employee WHERE employeeid = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
