import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src', 'pages');

const replaceInFile = (filename, isPatient) => {
  const filepath = path.join(pagesDir, filename);
  if (!fs.existsSync(filepath)) return;
  
  let content = fs.readFileSync(filepath, 'utf8');

  if (isPatient) {
    content = content.replace(/const patientId = session\?\.user\?\.user_metadata\?\.patient_id;/g, 'const userEmail = session?.user?.email;');
    content = content.replace(/getProfileById\(patientId\)/g, 'getProfileByEmail(userEmail)');
    content = content.replace(/getById\(patientId\)/g, 'getProfileByEmail(userEmail)');
    content = content.replace(/queryKey: \['patient-profile', patientId\]/g, "queryKey: ['patient-profile', userEmail]");
    // Fix enabled flag specifically on the profile query block
    content = content.replace(/(queryKey: \['patient-profile', userEmail\],\s*queryFn: [^,]+,\s*enabled: )!!patientId/g, '$1!!userEmail');
    
    // Insert patientId derivation right after the query
    content = content.replace(/(const { data: profile.*? } = useQuery\(\{[\s\S]*?\}\);)/, '$1\n  const patientId = profile?.patientid;');
  } else {
    content = content.replace(/const employeeId = session\?\.user\?\.user_metadata\?\.employee_id;/g, 'const userEmail = session?.user?.email;');
    content = content.replace(/getProfileById\(employeeId\)/g, 'getProfileByEmail(userEmail)');
    content = content.replace(/queryKey: \['(.*?-profile)', employeeId\]/g, "queryKey: ['$1', userEmail]");
    // Fix enabled flag specifically on the profile query block
    content = content.replace(/(queryKey: \['.*?-profile', userEmail\],\s*queryFn: [^,]+,\s*enabled: )!!employeeId/g, '$1!!userEmail');
    
    content = content.replace(/(const { data: profile.*? } = useQuery\(\{[\s\S]*?\}\);)/, '$1\n  const employeeId = profile?.employeeid;');
  }

  // Remove duplicate variable declarations if any are created
  content = content.replace(/const employeeId = session\?\.user\?\.user_metadata\?\.employee_id;/g, '');
  content = content.replace(/const patientId = session\?\.user\?\.user_metadata\?\.patient_id;/g, '');

  fs.writeFileSync(filepath, content, 'utf8');
};

const patientFiles = ['PatientFeedback.jsx', 'PatientDashboard.jsx', 'PatientCases.jsx', 'PatientBills.jsx', 'PatientProfile.jsx'];
const employeeFiles = ['NurseDashboard.jsx', 'NurseAssessment.jsx', 'DoctorDashboard.jsx', 'DoctorCases.jsx', 'DoctorAppointments.jsx', 'CreatePatient.jsx', 'DoctorProfile.jsx', 'AdminProfile.jsx', 'NurseProfile.jsx'];

patientFiles.forEach(f => replaceInFile(f, true));
employeeFiles.forEach(f => replaceInFile(f, false));

console.log('Done mapping components to userEmail resolution');
