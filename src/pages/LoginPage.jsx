import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError(null);
    setLoading(true);
    // Suggesting real demo emails if they exist, otherwise this will fail
    try {
      await login(`${role.toLowerCase()}@hospital.com`, 'password123');
      navigate('/dashboard');
    } catch (err) {
      setError(`Demo login failed: ${err.message}. Make sure the server is running and demo users exist in the database.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row font-display antialiased">
      {/* Left Section: Branding & Illustration */}
      <div className="relative hidden w-full flex-col justify-center medical-pattern lg:flex lg:w-1/2 p-12 xl:p-24 text-white">
        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <span className="material-symbols-outlined text-4xl">local_hospital</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight xl:text-5xl">
              City Hospital <br /> Management System
            </h1>
          </div>
          <p className="max-w-md text-lg font-medium text-slate-200/90 leading-relaxed">
            Streamlining patient care, one record at a time. A comprehensive solution for modern healthcare facilities.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6 max-w-lg">
            {[
              { icon: 'patient_list', label: 'Patient Records' },
              { icon: 'calendar_month', label: 'Scheduling' },
              { icon: 'prescriptions', label: 'Pharmacy' },
              { icon: 'lab_panel', label: 'Lab Reports' }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl bg-white/5 p-4 border border-white/10">
                <span className="material-symbols-outlined text-blue-300">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Decorative Large Icon */}
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[400px]">health_metrics</span>
        </div>
      </div>

      {/* Right Section: Login Form */}
      <div className="flex w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 lg:w-1/2">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-white dark:bg-slate-900 p-8 shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="text-center lg:text-left">
            <div className="inline-flex lg:hidden mb-6 h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <span className="material-symbols-outlined text-white">local_hospital</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Welcome Back</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Please enter your details to access your dashboard.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none transition-all"
                  id="email"
                  placeholder="name@hospital.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">
                  Password
                </label>
                <a className="text-xs font-medium text-primary hover:underline" href="#">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none transition-all"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <button
              className="w-full rounded-lg bg-primary py-3.5 text-center text-sm font-bold text-white shadow-lg transition-all hover:bg-primary/90 focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                  Signing in...
                </>
              ) : (
                'Login to Portal'
              )}
            </button>
          </form>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="mx-4 flex-shrink text-xs font-medium uppercase tracking-wider text-slate-400">Demo Profiles</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              { role: 'Admin', color: 'red', icon: 'shield_person' },
              { role: 'Doctor', color: 'blue', icon: 'medical_services' },
              { role: 'Nurse', color: 'emerald', icon: 'fluid_med' },
              { role: 'Patient', color: 'amber', icon: 'person' }
            ].map((demo) => (
              <button
                key={demo.role}
                onClick={() => handleDemoLogin(demo.role)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors bgs-${demo.color}`}
                style={{
                  backgroundColor: `var(--bg-${demo.color}-100)`,
                  color: `var(--text-${demo.color}-700)`
                }}
              >
                <span className="material-symbols-outlined text-sm">{demo.icon}</span>
                {demo.role}
              </button>
            ))}
          </div>

          {/* Fallback classes for demo buttons if dynamic vars fail */}
          <style>{`
            .bgs-red { background-color: #fee2e2; color: #b91c1c; }
            .bgs-blue { background-color: #dbeafe; color: #1d4ed8; }
            .bgs-emerald { background-color: #d1fae5; color: #047857; }
            .bgs-amber { background-color: #fef3c7; color: #b45309; }
            .dark .bgs-red { background-color: rgba(127, 29, 29, 0.3); color: #fca5a5; }
            .dark .bgs-blue { background-color: rgba(30, 58, 138, 0.3); color: #93c5fd; }
            .dark .bgs-emerald { background-color: rgba(6, 78, 59, 0.3); color: #6ee7b7; }
            .dark .bgs-amber { background-color: rgba(120, 53, 15, 0.3); color: #fcd34d; }
          `}</style>

          <div className="text-center space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Need assistance? <a className="font-semibold text-primary hover:underline" href="#">Contact IT Support</a>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              New patient?{' '}
              <Link to="/signup" className="font-semibold text-primary hover:underline">
                Register your account
              </Link>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Staff member?{' '}
              <Link to="/staff-register" className="font-semibold text-primary hover:underline">
                Portal registration
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
