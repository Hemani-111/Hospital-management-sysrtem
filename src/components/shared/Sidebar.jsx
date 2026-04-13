import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';

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
    setIsLogoutModalOpen(false);
    logout();
  };

  const cancelLogout = () => setIsLogoutModalOpen(false);

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
    ],
  };

  const currentRoleItems = navItems[user?.role] || navItems.admin;

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out flex flex-col
    md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
    ${user?.role === 'admin' ? 'bg-primary text-white border-none' : 'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800'}
  `;

  // Helper for item classes
  const getItemClasses = (path) => {
    const isActive = location.pathname === path;
    const base = "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold group relative overflow-hidden";
    if (user?.role === 'admin') {
      return isActive 
        ? `${base} bg-white/20 text-white shadow-premium shadow-white/10 ring-1 ring-white/30` 
        : `${base} text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1`;
    }
    return isActive
      ? `${base} bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20`
      : `${base} text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary hover:translate-x-1`;
  };

  const renderContent = () => {
    if (user?.role === 'admin') {
      return (
        <aside className={sidebarClasses}>
          <div className="p-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3 group/brand cursor-pointer">
              <div className="size-11 rounded-2xl bg-white/20 flex items-center justify-center shadow-premium ring-1 ring-white/30 group-hover/brand:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-white text-2xl">local_hospital</span>
              </div>
              <div className="transition-all duration-300 group-hover/brand:translate-x-1">
                <h1 className="font-black text-xl leading-none tracking-tighter text-white">MedAdmin</h1>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Health Systems</p>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all hover:rotate-90">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
            {currentRoleItems.map(item => (
              <Link key={item.id} to={item.path} onClick={onClose} className={getItemClasses(item.path)}>
                <span className="material-symbols-outlined transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">{item.icon}</span>
                <span className="text-sm tracking-tight">{item.label}</span>
                {location.pathname === item.path && (
                  <div className="absolute right-0 top-0 h-full w-1 bg-white rounded-l-full"></div>
                )}
              </Link>
            ))}
          </nav>

          <div className="p-4 space-y-3">
            <button onClick={toggleTheme} className="flex items-center w-full gap-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 transition-all group border border-white/5 shadow-inner">
               <span className="material-symbols-outlined group-hover:rotate-45 transition-transform duration-500">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
               <span className="text-[10px] font-black uppercase tracking-widest">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
            <div className="flex items-center gap-3 p-3 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-xl shadow-premium">
              <div className="size-10 rounded-2xl bg-white/20 overflow-hidden ring-2 ring-white/20 shadow-lg group-hover:scale-105 transition-transform">
                <img className="w-full h-full object-cover scale-150 transform object-top" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=ffe4e6`} alt="Admin" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate text-white leading-none mb-1 uppercase">{fullName}</p>
                <p className="text-[9px] text-white/60 truncate font-black uppercase tracking-widest">{user?.role || 'Admin'}</p>
              </div>
              <button onClick={handleLogoutClick} className="p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </div>
          </div>
        </aside>
      );
    }

    return (
      <aside className={sidebarClasses}>
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-12 bg-medical-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105">
              <span className="material-symbols-outlined text-2xl font-bold">health_metrics</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-primary uppercase">HealthSync</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Portal 2.0</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto no-scrollbar">
          {currentRoleItems.map(item => (
            <Link key={item.id} to={item.path} onClick={onClose} className={getItemClasses(item.path)}>
              <span className={`material-symbols-outlined transition-transform group-hover:scale-110 ${location.pathname === item.path ? 'scale-110' : ''}`}>{item.icon}</span>
              <span className="text-sm font-bold tracking-tight uppercase text-[11px]">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <button onClick={toggleTheme} className="flex flex-row items-center w-full gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest transition-all group">
             <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
             {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 group transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
            <div className="size-10 rounded-full bg-primary/10 overflow-hidden ring-2 ring-white dark:ring-slate-700 shadow-sm transition-transform group-hover:scale-105">
              <img className="w-full h-full object-cover scale-150 transform object-top" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=e0f2fe`} alt="User Avatar" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate text-slate-900 dark:text-slate-100 uppercase tracking-tight">{fullName}</p>
              <p className="text-[10px] text-slate-500 truncate font-bold uppercase tracking-widest opacity-70">{user?.role || 'User'}</p>
            </div>
            <button onClick={handleLogoutClick} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>
    );
  };

  return (
    <>
      {renderContent()}
      
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-16 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center mb-6 ring-4 ring-red-50 dark:ring-red-900/10">
                <span className="material-symbols-outlined text-3xl">logout</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mb-2">Sign Out</h3>
              <p className="text-sm font-bold text-slate-500 mb-8">Are you sure you want to end your session?</p>
              
              <div className="flex w-full gap-3">
                <button onClick={cancelLogout} className="flex-1 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmLogout} className="flex-1 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
