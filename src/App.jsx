import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { useAuthStore } from './store/authStore';
import './App.css';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import StaffRegisterPage from './pages/StaffRegisterPage';
import ProtectedRoute from './components/shared/ProtectedRoute';

// Real Dashboards
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import NurseDashboard from './pages/NurseDashboard';

// Feature Pages
import CreatePatient from './pages/CreatePatient';
import BillingManagement from './pages/BillingManagement';
import NurseAssessment from './pages/NurseAssessment';
import NurseAssessmentHistory from './pages/NurseAssessmentHistory';
import PatientRecords from './pages/PatientRecords';
import VitalsMonitor from './pages/VitalsMonitor';
import NurseLabResults from './pages/NurseLabResults';
import NurseAdmissions from './pages/NurseAdmissions';

// Admin Extracted Pages
import AssignCase from './pages/AssignCase';
import ManageStaff from './pages/ManageStaff';
import ManageRooms from './pages/ManageRooms';
import PatientList from './pages/PatientList';

// Doctor Extracted Pages
import DoctorCases from './pages/DoctorCases';
import DoctorCaseDetail from './pages/DoctorCaseDetail';
import DoctorAppointments from './pages/DoctorAppointments';
import DoctorProfile from './pages/DoctorProfile';
import UserProfileRouter from './pages/UserProfileRouter';

// Patient Extracted Pages
import PatientCases from './pages/PatientCases';
import PatientBills from './pages/PatientBills';
import PatientFeedback from './pages/PatientFeedback';

const queryClient = new QueryClient();

// High-level role-based dashboard router
const DashboardRouter = () => {
  const { user } = useAuthStore();

  if (!user?.role) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <span className="material-symbols-outlined text-6xl text-amber-500 animate-pulse">warning</span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Access Restricted</h2>
          <p className="text-slate-500 text-sm">
            You have successfully signed in, but your account (<span className="font-bold text-slate-700 dark:text-slate-300 font-mono text-xs">{user?.email || 'authenticated user'}</span>) has not been assigned a role yet.
          </p>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[10px] text-left font-mono text-slate-400 border border-slate-100 dark:border-slate-700">
             # Run this in pgAdmin:<br/>
             UPDATE users SET Role = 'admin' WHERE email = '{user?.email || 'your-email'}';
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-3 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all uppercase tracking-widest text-xs active:scale-95"
          >
            Refresh Dashboard
          </button>
          <button 
            onClick={() => useAuthStore.getState().logout()} 
            className="w-full text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors py-2"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'patient':
      return <PatientDashboard />;
    case 'nurse':
      return <NurseDashboard />;
    default:
      return <Navigate to="/login" />;
  }
};

import { useEffect } from 'react';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="App">
          <Router>
            <Routes>
              <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
              <Route path="/signup" element={!isAuthenticated ? <SignUpPage /> : <Navigate to="/dashboard" />} />
              <Route path="/staff-register" element={!isAuthenticated ? <StaffRegisterPage /> : <Navigate to="/dashboard" />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardRouter />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/patients/create" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <CreatePatient />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/billing" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <BillingManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assess" 
                element={
                  <ProtectedRoute allowedRoles={['nurse']}>
                    <NurseAssessment />
                  </ProtectedRoute>
                } 
              />
              <Route path="/records" element={<ProtectedRoute allowedRoles={['nurse']}><PatientRecords /></ProtectedRoute>} />
              <Route path="/lab-results" element={<ProtectedRoute allowedRoles={['nurse']}><NurseLabResults /></ProtectedRoute>} />
              <Route path="/vitals" element={<ProtectedRoute allowedRoles={['nurse']}><VitalsMonitor /></ProtectedRoute>} />
              <Route path="/nurse-admissions" element={<ProtectedRoute allowedRoles={['nurse']}><NurseAdmissions /></ProtectedRoute>} />
              
              <Route path="/assign_case" element={<ProtectedRoute allowedRoles={['admin']}><AssignCase /></ProtectedRoute>} />
              <Route path="/manage_staff" element={<ProtectedRoute allowedRoles={['admin']}><ManageStaff /></ProtectedRoute>} />
              <Route path="/manage_rooms" element={<ProtectedRoute allowedRoles={['admin']}><ManageRooms /></ProtectedRoute>} />
              <Route path="/patient_list" element={<ProtectedRoute allowedRoles={['admin']}><PatientList /></ProtectedRoute>} />

              {/* Doctor/Nurse specific missing routes */}
              <Route path="/cases" element={<ProtectedRoute allowedRoles={['doctor', 'nurse']}><DoctorCases /></ProtectedRoute>} />
              <Route path="/cases/:id" element={<ProtectedRoute allowedRoles={['doctor', 'nurse']}><DoctorCaseDetail /></ProtectedRoute>} />
              <Route path="/assessment-history" element={<ProtectedRoute allowedRoles={['nurse']}><NurseAssessmentHistory /></ProtectedRoute>} />
              <Route path="/appointments" element={<ProtectedRoute allowedRoles={['doctor', 'patient', 'nurse']}><DoctorAppointments /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'patient', 'nurse']}><UserProfileRouter /></ProtectedRoute>} />
              
              {/* Patient unique views */}
              <Route path="/patient/cases" element={<ProtectedRoute allowedRoles={['patient']}><PatientCases /></ProtectedRoute>} />
              <Route path="/patient/billing" element={<ProtectedRoute allowedRoles={['patient']}><PatientBills /></ProtectedRoute>} />
              <Route path="/feedback" element={<ProtectedRoute allowedRoles={['patient']}><PatientFeedback /></ProtectedRoute>} />

              <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
