import { query } from './server/db.js';

async function checkPatients() {
  try {
    const result = await query('SELECT * FROM patient LIMIT 10');
    console.log('Patients in DB:', JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('DB Error:', err);
    process.exit(1);
  }
}

checkPatients();
