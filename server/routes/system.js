import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// --- DASHBOARD ANALYTICS ---
router.get('/analytics/overview', async (req, res) => {
  try {
    const revenueResult = await query(`
      SELECT TO_CHAR(GeneratedOn, 'Mon') as name, SUM(TotalAmount) as revenue
      FROM bill
      WHERE GeneratedOn >= NOW() - INTERVAL '6 months'
      GROUP BY name, DATE_TRUNC('month', GeneratedOn)
      ORDER BY DATE_TRUNC('month', GeneratedOn)
    `);

    const inflowResult = await query(`
      SELECT TO_CHAR(CreatedOn, 'Mon') as name, COUNT(*) as patients
      FROM CaseRequest
      WHERE CreatedOn >= NOW() - INTERVAL '6 months'
      GROUP BY name, DATE_TRUNC('month', CreatedOn)
      ORDER BY DATE_TRUNC('month', CreatedOn)
    `);

    const roomResult = await query(`
      SELECT 
        COUNT(*) filter (where isoccupied = true) as occupied,
        COUNT(*) filter (where isoccupied = false) as available
      FROM room
    `);

    res.json({
      revenueTrends: revenueResult.rows,
      inflowTrends: inflowResult.rows,
      occupancy: [
        { name: 'Occupied', value: parseInt(roomResult.rows[0].occupied) },
        { name: 'Available', value: parseInt(roomResult.rows[0].available) }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GLOBAL SEARCH ---
router.get('/search/global', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  const searchTerm = `%${q}%`;
  try {
    const result = await query(`
      (SELECT 'patient' as type, patientid as id, CONCAT(firstname, ' ', lastname) as name, '/patient_list' as link 
       FROM Patient 
       WHERE firstname ILIKE $1 OR lastname ILIKE $1 OR patientid::text ILIKE $1)
      UNION ALL
      (SELECT 'doctor' as type, employeeid as id, CONCAT(firstname, ' ', lastname) as name, '/manage_staff' as link 
       FROM Employee 
       WHERE firstname ILIKE $1 OR lastname ILIKE $1 OR employeeid::text ILIKE $1)
      UNION ALL
      (SELECT 'case' as type, caserequestid as id, casesummary as name, '/cases' as link 
       FROM CaseRequest 
       WHERE caserequestid::text ILIKE $1 OR casesummary ILIKE $1)
      LIMIT 10
    `, [searchTerm]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
