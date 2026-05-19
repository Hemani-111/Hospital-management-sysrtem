import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { billingService } from '../../services/billingService';
import { caseService } from '../../services/caseService';
import { appointmentService } from '../../services/appointmentService';
import { employeeService } from '../../services/employeeService';
import { patientPortalService } from '../../services/patientPortalService';
import LogoutModal from '../ui/LogoutModal';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Guest';
  const lastName = user?.user_metadata?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const seed = lastName || firstName || 'User';

  const handleLogoutClick = () => setIsLogoutModalOpen(true);

  const confirmLogout = () => {
    logout();
  };

  const cancelLogout = () => setIsLogoutModalOpen(false);

  // --- STATS FOR BADGES ---
  const { data: billingData = [] } = useQuery({
    queryKey: ['sidebar-billing'],
    queryFn: () => billingService.getAll(),
    enabled: user?.role === 'admin',
    refetchInterval: 30000 // Refresh every 30s
  });

  const { data: casesData = [] } = useQuery({
    queryKey: ['sidebar-cases'],
    queryFn: () => caseService.getAll(),
    enabled: user?.role === 'admin' || user?.role === 'nurse',
    refetchInterval: 30000
  });

  const { data: profile } = useQuery({
    queryKey: ['sidebar-profile', user?.email],
    queryFn: () => user?.role === 'doctor' ? employeeService.getProfileByEmail(user?.email) : null,
    enabled: user?.role === 'doctor'
  });

  const { data: appointmentsData = [] } = useQuery({
    queryKey: ['sidebar-appointments', profile?.employeeid],
    queryFn: () => appointmentService.getDoctorAppointments(profile?.employeeid),
    enabled: !!profile?.employeeid,
    refetchInterval: 60000
  });

  const stats = {
    pendingBills: billingData.filter(b => b.paymentstatus === 'Pending').length,
    openCases: casesData.filter(c => c.status === 'Open').length,
    todayAppts: appointmentsData.filter(a => {
      const today = new Date().toISOString().split('T')[0];
      return a.appointmentdate === today;
    }).length
  };

  const navItems = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
      { id: 'create_patient', label: 'Create Patient', icon: 'person_add', path: '/patients/create' },
      { id: 'assign_case', label: 'Assign Case', icon: 'assignment_ind', path: '/assign_case' },
      { id: 'manage_staff', label: 'Manage Staff', icon: 'badge', path: '/manage_staff' },
      { id: 'manage_rooms', label: 'Manage Rooms', icon: 'meeting_room', path: '/manage_rooms' },
      { id: 'patient_list', label: 'Patient List', icon: 'group', path: '/patient_list' },
      { id: 'billing', label: 'Billing', icon: 'payments', path: '/billing' },
      { id: 'profile', label: 'My Profile', icon: 'person', path: '/profile' },
    ],
    doctor: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
      { id: 'cases', label: 'My Cases', icon: 'assignment', path: '/cases' },
      { id: 'appointments', label: 'Appointments', icon: 'calendar_today', path: '/appointments' },
      { id: 'profile', label: 'My Profile', icon: 'person', path: '/profile' },
    ],
    nurse: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
      { id: 'assess', label: 'Assess Patient', icon: 'stethoscope', path: '/assess' },
      { id: 'assessment_history', label: 'Assessments', icon: 'history_edu', path: '/assessment-history' },
      { id: 'records', label: 'Patient Records', icon: 'folder_shared', path: '/records' },
      { id: 'vitals', label: 'Vitals Monitor', icon: 'monitoring', path: '/vitals' },
      { id: 'cases', label: 'My Cases', icon: 'assignment', path: '/cases' },
      { id: 'profile', label: 'My Profile', icon: 'person', path: '/profile' },
    ],
    patient: [
      { id: 'profile', label: 'Profile', icon: 'person', path: '/profile' },
      { id: 'cases', label: 'Cases', icon: 'folder_open', path: '/patient/cases' },
      { id: 'appointments', label: 'Appts', icon: 'calendar_today', path: '/appointments' },
      { id: 'billing', label: 'Bills', icon: 'receipt_long', path: '/patient/billing' },
      { id: 'feedback', label: 'Feedback', icon: 'chat_bubble', path: '/feedback' },
      { id: 'support', label: 'Support', icon: 'support_agent', path: '/support' },
    ],
  };

  const currentRoleItems = navItems[user?.role] || navItems.admin;

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-72 md:w-64 transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col
    md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl ring-1 ring-black/5' : '-translate-x-full'}
    bg-primary text-white border-none
  `;

  // Helper for item classes
  const getItemClasses = (path) => {
    const isActive = location.pathname === path;
    const base = "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold group relative overflow-hidden";
    return isActive 
      ? `${base} bg-white/20 text-white shadow-premium shadow-white/10 ring-1 ring-white/30` 
      : `${base} text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1`;
  };

  const renderContent = () => {
    const roleTitles = {
      admin: 'Admin Portal',
      doctor: 'Doctor Portal',
      nurse: 'Staff Portal',
      patient: 'Patient Portal'
    };
    const subtitle = roleTitles[user?.role] || 'Healthcare Portal';

    return (
      <aside className={sidebarClasses}>
        <div className="px-4 py-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 group/brand cursor-pointer">
            <div className="size-20 flex items-center justify-center transition-transform duration-500 overflow-hidden p-1">
              <img src="/logo.png" alt="Aarogya Logo" className="w-full h-full object-contain" />
            </div>
            <div className="transition-all duration-300 group-hover/brand:translate-x-1">
              <h1 className="font-black text-xl leading-none tracking-tighter text-white">Aarogya</h1>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all hover:rotate-90">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
          {currentRoleItems.map(item => {
            const badgeCount = 
              (item.id === 'billing' && user?.role === 'admin') ? stats.pendingBills :
              (item.id === 'cases' && user?.role === 'nurse') ? stats.openCases :
              (item.id === 'dashboard' && user?.role === 'doctor') ? stats.todayAppts : 0;

            return (
              <Link key={item.id} to={item.path} onClick={onClose} className={getItemClasses(item.path)}>
                <span className="material-symbols-outlined transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">{item.icon}</span>
                <span className="text-sm tracking-tight">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="ml-auto flex items-center justify-center size-5 bg-white text-primary text-[10px] font-black rounded-full shadow-sm ring-2 ring-white/20 animate-in zoom-in duration-500">
                    {badgeCount}
                  </span>
                )}
                {location.pathname === item.path && (
                  <div className="absolute right-0 top-0 h-full w-1 bg-white rounded-l-full"></div>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  };

  return (
    <>
      {renderContent()}
      
      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </>
  );
};

export default Sidebar;
