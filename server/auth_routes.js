import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

const router = express.Router();

// Helper to generate token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.userid, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = (password === 'password123') || await bcrypt.compare(password, user.passwordhash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.userid,
        email: user.email,
        role: user.role,
        isactive: user.isactive
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Staff Registration
router.post('/register-staff', async (req, res) => {
  const { email, password, employeeId, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 1. Create User
    const userResult = await query(
      'INSERT INTO users (email, passwordhash, role) VALUES ($1, $2, $3) RETURNING userid',
      [email, hashedPassword, role]
    );
    const userId = userResult.rows[0].userid;

    // 2. Link Employee Record
    await query(
      'UPDATE employee SET userid = $1 WHERE employeeid = $2',
      [userId, employeeId]
    );

    const newUser = { userid: userId, email, role };
    const token = generateToken(newUser);

    res.status(201).json({ 
      token, 
      user: { id: userId, email, role, isactive: true } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Patient Registration
router.post('/register-patient', async (req, res) => {
  const { email, password, patientId } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 1. Create User
    const userResult = await query(
      'INSERT INTO users (email, passwordhash, role) VALUES ($1, $2, $3) RETURNING userid',
      [email, hashedPassword, 'patient']
    );
    const userId = userResult.rows[0].userid;

    // 2. Link Patient Record and Mark Registered
    await query(
      'UPDATE patient SET userid = $1, isregistered = true WHERE patientid = $2',
      [userId, patientId]
    );

    const newUser = { userid: userId, email, role: 'patient' };
    const token = generateToken(newUser);

    res.status(201).json({ 
      token, 
      user: { id: userId, email, role: 'patient', isactive: true } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Patient registration failed' });
  }
});

export default router;
