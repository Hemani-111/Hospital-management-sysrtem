import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { query } from './db.js';
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import patientRoutes from './routes/patients.js';
import clinicalRoutes from './routes/clinical.js';
import billingRoutes from './routes/billing.js';
import facilityRoutes from './routes/facility.js';
import systemRoutes from './routes/system.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false, // For easier demo/development
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api', clinicalRoutes);
app.use('/api', facilityRoutes);
app.use('/api', systemRoutes);

// Basic Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Test Database Connection
app.get('/db-test', async (req, res) => {
  try {
    const result = await query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`HMS Backend running on http://localhost:${PORT}`);
});
