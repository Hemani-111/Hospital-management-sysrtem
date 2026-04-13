const { Client } = require('pg'); 
const client = new Client({ connectionString: 'postgres://postgres:saikiran@2166@localhost:5432/hms_db' }); 
client.connect().then(async () => { 
  const sequences = [
    { table: 'patientassessment', idColumn: 'assessmentid' },
    { table: 'caserequest', idColumn: 'caserequestid' },
    { table: 'labreport', idColumn: 'reportid' },
    { table: 'diagnosis', idColumn: 'diagnosisid' },
    { table: 'prescription', idColumn: 'prescriptionid' },
    { table: 'appointment', idColumn: 'appointmentid' }
  ]; 
  
  for (let seq of sequences) { 
    try { 
      const query = `SELECT setval(pg_get_serial_sequence('${seq.table}', '${seq.idColumn}'), (SELECT COALESCE(MAX(${seq.idColumn}), 1) FROM ${seq.table}));`;
      const res = await client.query(query); 
      console.log(`Fixed ${seq.table} sequence:`, res.rows[0]); 
    } catch(e) { 
      console.log(`Error fixing ${seq.table}:`, e.message); 
    } 
  } 
  process.exit(0); 
});
