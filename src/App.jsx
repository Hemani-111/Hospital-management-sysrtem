import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { useAuthStore } from './store/authStore';
import './App.css';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
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

  switch (user?.role) {
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
import { supabase } from './lib/supabase';

function App() {
  const { isAuthenticated, setSession } = useAuthStore();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="App">
          <Router>
            <Routes>
              <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
              <Route path="/signup" element={!isAuthenticated ? <SignUpPage /> : <Navigate to="/dashboard" />} />
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
              <Route path="/vitals" element={<ProtectedRoute allowedRoles={['nurse']}><VitalsMonitor /></ProtectedRoute>} />
              
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
