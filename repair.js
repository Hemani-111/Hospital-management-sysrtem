import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src', 'pages');

const replaceInFile = (filename, isPatient) => {
  const filepath = path.join(pagesDir, filename);
  if (!fs.existsSync(filepath)) return;
  
  let content = fs.readFileSync(filepath, 'utf8');

  if (isPatient) {
    content = content.replace(/const userId = session\?\.user\?\.id;/g, 'const patientId = session?.user?.user_metadata?.patient_id;');
    content = content.replace(/getProfileByUserId\(userId\)/g, 'getProfileById(patientId)');
    content = content.replace(/queryKey: \[(.*?), userId\]/g, 'queryKey: [$1, patientId]');
    content = content.replace(/enabled: !!userId/g, 'enabled: !!patientId');
    // Also change `userId` to `patientId` if it is passed around inside query or something else
    // But be careful not to replace things randomly.
  } else {
    content = content.replace(/const userId = session\?\.user\?\.id;/g, 'const employeeId = session?.user?.user_metadata?.employee_id;');
    content = content.replace(/getProfileByUserId\(userId\)/g, 'getProfileById(employeeId)');
    content = content.replace(/queryKey: \[(.*?), userId\]/g, 'queryKey: [$1, employeeId]');
    content = content.replace(/enabled: !!userId/g, 'enabled: !!employeeId');
  }

  fs.writeFileSync(filepath, content, 'utf8');
};

const patientFiles = ['PatientFeedback.jsx', 'PatientDashboard.jsx', 'PatientCases.jsx', 'PatientBills.jsx'];
const employeeFiles = ['NurseDashboard.jsx', 'NurseAssessment.jsx', 'DoctorDashboard.jsx', 'DoctorCases.jsx', 'DoctorAppointments.jsx', 'CreatePatient.jsx'];

patientFiles.forEach(f => replaceInFile(f, true));
employeeFiles.forEach(f => replaceInFile(f, false));

console.log('Done modifying dashboard files');
