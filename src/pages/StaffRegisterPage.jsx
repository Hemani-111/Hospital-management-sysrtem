import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { employeeService } from '../services/employeeService';

const STEPS = ['verify', 'account', 'success'];

const StaffRegisterPage = () => {
  const navigate = useNavigate();

  const [step, setStep]                       = useState('verify');
  
  // Auto-redirect effect
  React.useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => navigate('/dashboard'), 3000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

  const [signupCode, setSignupCode]           = useState('');
  const [employeeRecord, setEmployeeRecord]   = useState(null);
  const [verifyLoading, setVerifyLoading]     = useState(false);
  const [verifyError, setVerifyError]         = useState(null);

  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]                   = useState(false);
  const [createLoading, setCreateLoading]     = useState(false);
  const [createError, setCreateError]         = useState(null);

  // ---- STEP 1: Verify the employee ID ----
  const handleVerifyID = async (e) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifyLoading(true);
    try {
      const idNumber = signupCode.trim().toUpperCase();
      const record = await employeeService.verifyEmployeeID(idNumber);

      if (!record) {
        setVerifyError('Employee ID not found. Please contact your administrator.');
        return;
      }
      setEmployeeRecord(record);
      setStep('account');
    } catch (err) {
      console.error('Registration Verify Error:', err);
      // Show the actual error message (e.g. Permission Denied) to help debugging
      setVerifyError(err.message || 'Verification failed. Please check your connection.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // ---- STEP 2: Create Supabase Auth account ----
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreateError(null);
    if (password !== confirmPassword) { setCreateError('Passwords do not match.'); return; }
    if (password.length < 8) { setCreateError('Password must be at least 8 characters.'); return; }

    setCreateLoading(true);
    try {
      // 1. Create the Supabase Auth user
      const role = employeeRecord.employeetype.toLowerCase();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            first_name: employeeRecord.firstname,
            last_name: employeeRecord.lastname,
            employee_id: employeeRecord.employeeid,
          }
        }
      });
      if (authError) throw authError;

      // 2. Insert into our "users" table (ensure email is lowercased for consistency)
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          passwordhash: 'managed_by_supabase_auth',
          role,
          isactive: true
        })
        .select('userid')
        .single();
      if (userError) throw userError;

      // 3. Link the employee record to the new user
      const { error: linkError } = await supabase
        .from('employee')
        .update({ userid: userRow.userid })
        .eq('employeeid', employeeRecord.employeeid);
      if (linkError) throw linkError;

      setStep('success');
    } catch (err) {
      setCreateError(err.message || 'Failed to create account.');
    } finally {
      setCreateLoading(false);
    }
  };

  // ---- Step Indicator ----
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[
        { key: 'verify', label: 'Verify ID', icon: 'badge' },
        { key: 'account', label: 'Create Account', icon: 'manage_accounts' },
        { key: 'success', label: 'Done', icon: 'check_circle' },
      ].map((s, idx) => {
        const stepIndex = STEPS.indexOf(step);
        const sIndex = STEPS.indexOf(s.key);
        const isActive = s.key === step;
        const isCompleted = sIndex < stepIndex;
        return (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
                {isCompleted
                  ? <span className="material-symbols-outlined text-sm">check</span>
                  : <span className="material-symbols-outlined text-sm">{s.icon}</span>
                }
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                isActive ? 'text-primary' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
              }`}>{s.label}</span>
            </div>
            {idx < 2 && (
              <div className={`h-0.5 w-12 rounded-full transition-all duration-500 ${sIndex < stepIndex ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row font-display antialiased">
      {/* Left Panel */}
      <div className="relative hidden w-full flex-col justify-center medical-pattern lg:flex lg:w-1/2 p-12 xl:p-24 text-white">
        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <span className="material-symbols-outlined text-4xl">badge</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight xl:text-5xl">
              Staff Portal<br />Registration
            </h1>
          </div>
          <p className="max-w-md text-lg font-medium text-slate-200/90 leading-relaxed">
            Welcome to City Hospital. Use your official **Employee ID** provided by your administrator to create your staff portal account.
          </p>
          <div className="mt-8 space-y-4 max-w-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300">How it works</p>
            {[
              { icon: 'badge', step: '01', text: 'Obtain your unique Employee ID from the hospital administrator.' },
              { icon: 'app_registration', step: '02', text: 'Enter your ID and email to set a secure account password.' },
              { icon: 'dashboard', step: '03', text: 'Log in and access your personalized professional dashboard.' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-4 rounded-xl bg-white/5 p-4 border border-white/10">
                <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <span className="material-symbols-outlined text-base text-blue-300">{item.icon}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Step {item.step}</span>
                  <p className="text-sm text-slate-200/90">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[400px]">local_hospital</span>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white dark:bg-slate-900 p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-start gap-4">
              <button onClick={() => navigate('/login')} className="mt-0.5 p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-xl flex-shrink-0">
                <span className="material-symbols-outlined font-black text-[22px]">arrow_back</span>
              </button>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Staff Registration</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Are you a patient?{' '}
                  <Link to="/signup" className="font-semibold text-primary hover:underline">Register here</Link>
                </p>
              </div>
            </div>

            <StepIndicator />

            {step === 'verify' && (
              <form onSubmit={handleVerifyID} className="space-y-5">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 flex gap-3">
                  <span className="material-symbols-outlined text-blue-500 text-xl flex-shrink-0 mt-0.5">info</span>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    Your **Employee ID** was assigned to you by the administrator when your profile was created. It looks like **EMP-24-XXXX**.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Employee ID</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">badge</span>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 font-mono text-sm uppercase tracking-widest focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none transition-all"
                      placeholder="e.g., EMP-24-XXXX"
                      value={signupCode}
                      onChange={e => setSignupCode(e.target.value.toUpperCase())}
                      required autoFocus
                    />
                  </div>
                </div>
                {verifyError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-xs font-medium text-red-600 border border-red-100">
                    <span className="material-symbols-outlined text-sm flex-shrink-0">error</span>
                    {verifyError}
                  </div>
                )}
                <button type="submit" disabled={verifyLoading || !signupCode.trim()}
                  className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-white shadow-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {verifyLoading
                    ? <><span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> Verifying...</>
                    : <><span className="material-symbols-outlined text-sm">badge</span> Verify My ID</>
                  }
                </button>
              </form>
            )}

            {/* ===== STEP 2: Create Account ===== */}
            {step === 'account' && employeeRecord && (
              <form onSubmit={handleCreateAccount} className="space-y-5">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 p-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-500 text-xl">check_circle</span>
                  <div>
                    <p className="text-xs font-bold text-emerald-700">ID Verified!</p>
                    <p className="text-xs text-emerald-600">
                      Setting up account for <strong>{employeeRecord.firstname} {employeeRecord.lastname}</strong> ({employeeRecord.employeetype})
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Your Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                    <input type="email" className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none transition-all"
                      placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Set Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                    <input type={showPw ? 'text' : 'password'} className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none transition-all"
                      placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <span className="material-symbols-outlined">{showPw ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock_reset</span>
                    <input type={showPw ? 'text' : 'password'} className={`w-full rounded-lg border py-3 pl-11 pr-4 text-slate-900 focus:ring-2 outline-none transition-all dark:text-slate-100 dark:bg-slate-800 ${
                      confirmPassword && password !== confirmPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-200 bg-red-50' : 'border-slate-300 dark:border-slate-700 focus:border-primary focus:ring-primary/20 bg-white'
                    }`}
                      placeholder="Re-enter password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>
                {createError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-xs font-medium text-red-600 border border-red-100">
                    <span className="material-symbols-outlined text-sm flex-shrink-0">error</span>
                    {createError}
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setStep('verify'); setCreateError(null); }}
                    className="flex-shrink-0 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">arrow_back</span> Back
                  </button>
                  <button type="submit" disabled={createLoading}
                    className="flex-1 rounded-lg bg-primary py-3.5 text-sm font-bold text-white shadow-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                    {createLoading
                      ? <><span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> Creating...</>
                      : <><span className="material-symbols-outlined text-sm">person_add</span> Create Account</>
                    }
                  </button>
                </div>
              </form>
            )}

            {/* ===== STEP 3: Success ===== */}
            {step === 'success' && (
              <div className="text-center space-y-6 py-4 animate-in zoom-in-95 duration-500">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-100/50">
                      <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin opacity-30"></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">Account Activated!</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Welcome to the team, <span className="font-bold text-slate-700 dark:text-slate-200">{employeeRecord?.firstname}</span>. 
                    Your professional dashboard is being prepared.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 text-emerald-600 font-bold text-xs uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 py-3 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                  Redirecting to Dashboard...
                </div>
              </div>
            )}
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">
            Not a staff member?{' '}
            <Link to="/signup" className="font-medium text-slate-500 hover:text-primary">Patient registration →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffRegisterPage;
