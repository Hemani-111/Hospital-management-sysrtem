import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const STEPS = ['verify', 'account', 'success'];

const SignUpPage = () => {
  const navigate = useNavigate();

  // Step tracking
  const [step, setStep] = useState('verify'); // 'verify' | 'account' | 'success'

  // Step 1: Signup code verification
  const [signupCode, setSignupCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [patientRecord, setPatientRecord] = useState(null); // matched patient row

  // Step 2: Account creation
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  // ------------------------------------------------------------------
  // Step 1: Verify the signup code against the Patient table
  // ------------------------------------------------------------------
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifyLoading(true);

    try {
      const trimmedCode = signupCode.trim().toUpperCase();

      const { data, error } = await supabase
        .from('patient')
        .select('patientid, firstname, lastname, signupcode, isregistered, userid')
        .eq('signupcode', trimmedCode)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setVerifyError('Invalid signup code. Please check with your hospital administrator.');
        return;
      }

      if (data.isregistered || data.userid) {
        setVerifyError('This signup code has already been used. Please log in instead.');
        return;
      }

      setPatientRecord(data);
      setStep('account');
    } catch (err) {
      setVerifyError(err.message || 'Failed to verify signup code.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Step 2: Create Supabase Auth account & link to patient record
  // ------------------------------------------------------------------
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreateError(null);

    if (password !== confirmPassword) {
      setCreateError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setCreateError('Password must be at least 8 characters.');
      return;
    }

    setCreateLoading(true);

    try {
      // 1. Create the Supabase auth user with role metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'patient',
            first_name: patientRecord.firstname,
            last_name: patientRecord.lastname,
            patient_id: patientRecord.patientid,
          },
        },
      });

      if (authError) throw authError;

      const authUserId = authData.user?.id;
      if (!authUserId) throw new Error('Failed to create user account.');

      // 2. Insert into the "User" table (quoted in SQL, so Pascal name works, but columns are lower)
      const { data: userRow, error: userInsertError } = await supabase
        .from('User')
        .insert({
          email: email,
          passwordhash: 'managed_by_supabase_auth',
          role: 'patient',
          isactive: true,
        })
        .select('userid')
        .single();

      if (userInsertError) throw userInsertError;

      // 3. Link the patient record to the new user
      const { error: updateError } = await supabase
        .from('patient')
        .update({
          userid: userRow.userid,
          isregistered: true,
        })
        .eq('patientid', patientRecord.patientid);

      if (updateError) throw updateError;

      setStep('success');
    } catch (err) {
      setCreateError(err.message || 'Failed to create account.');
    } finally {
      setCreateLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // UI helpers
  // ------------------------------------------------------------------
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[
        { key: 'verify', label: 'Verify Code', icon: 'key' },
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
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900'
                    : isActive
                    ? 'bg-primary text-white shadow-lg shadow-blue-200 dark:shadow-blue-900'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-sm">check</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">{s.icon}</span>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  isActive
                    ? 'text-primary'
                    : isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {s.label}
              </span>
            </div>
            {idx < 2 && (
              <div
                className={`h-0.5 w-12 rounded-full transition-all duration-500 ${
                  sIndex < stepIndex ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="flex min-h-screen flex-col lg:flex-row font-display antialiased">

      {/* Left Panel: Branding */}
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
            Your health, your records, your care — all in one place. Register today to access your medical history, appointments, and bills online.
          </p>

          {/* How it works */}
          <div className="mt-8 space-y-4 max-w-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300">How Patient Registration Works</p>
            {[
              { icon: 'qr_code', step: '01', text: 'Get your unique signup code from the hospital reception.' },
              { icon: 'app_registration', step: '02', text: 'Enter the code and create your online account.' },
              { icon: 'health_and_safety', step: '03', text: 'Access your records, appointments, and bills instantly.' },
            ].map((item) => (
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
        {/* Decorative icon */}
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[400px]">health_metrics</span>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 lg:w-1/2">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <span className="material-symbols-outlined text-white text-xl">local_hospital</span>
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white">City Hospital</span>
            </div>
          </div>

          <div className="rounded-xl bg-white dark:bg-slate-900 p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">

            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Patient Registration</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>

            <StepIndicator />

            {/* ===== STEP 1: Verify Signup Code ===== */}
            {step === 'verify' && (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 flex gap-3">
                  <span className="material-symbols-outlined text-blue-500 text-xl flex-shrink-0 mt-0.5">info</span>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    You need a <strong>Signup Code</strong> from the hospital to register. This code was provided when your patient record was created. Ask the reception desk if you don't have one.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="signup-code">
                    Patient Signup Code
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">key</span>
                    <input
                      id="signup-code"
                      type="text"
                      className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 font-mono text-sm uppercase tracking-widest focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none transition-all"
                      placeholder="e.g. PAT-2025-001"
                      value={signupCode}
                      onChange={(e) => setSignupCode(e.target.value.toUpperCase())}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {verifyError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-xs font-medium text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800">
                    <span className="material-symbols-outlined text-sm flex-shrink-0">error</span>
                    {verifyError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={verifyLoading || !signupCode.trim()}
                  className="w-full rounded-lg bg-primary py-3.5 text-center text-sm font-bold text-white shadow-lg transition-all hover:bg-primary/90 focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verifyLoading ? (
                    <>
                      <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">verified</span>
                      Verify Code
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ===== STEP 2: Create Account ===== */}
            {step === 'account' && patientRecord && (
              <form onSubmit={handleCreateAccount} className="space-y-5">
                {/* Verified patient banner */}
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-500 text-xl">check_circle</span>
                  <div>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Code Verified!</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Creating account for <strong>{patientRecord.FirstName} {patientRecord.LastName}</strong>
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                    <input
                      id="email"
                      type="email"
                      className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none transition-all"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none transition-all"
                      placeholder="Min. 8 characters"
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
                  {/* Strength indicator */}
                  {password && (
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            password.length >= i * 3
                              ? password.length >= 12
                                ? 'bg-emerald-400'
                                : password.length >= 8
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="confirm-password">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock_reset</span>
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`w-full rounded-lg border py-3 pl-11 pr-12 text-slate-900 focus:ring-2 outline-none transition-all dark:text-slate-100 dark:bg-slate-800 ${
                        confirmPassword && password !== confirmPassword
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-200 bg-red-50 dark:bg-red-900/10'
                          : confirmPassword && password === confirmPassword
                          ? 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-200 bg-white dark:bg-slate-800'
                          : 'border-slate-300 dark:border-slate-700 focus:border-primary focus:ring-primary/20 bg-white dark:bg-slate-800'
                      }`}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                    {confirmPassword && password === confirmPassword && (
                      <span className="material-symbols-outlined absolute right-10 top-1/2 -translate-y-1/2 text-emerald-500 text-sm">check_circle</span>
                    )}
                  </div>
                </div>

                {createError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-xs font-medium text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800">
                    <span className="material-symbols-outlined text-sm flex-shrink-0">error</span>
                    {createError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep('verify'); setCreateError(null); }}
                    className="flex-shrink-0 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 rounded-lg bg-primary py-3.5 text-center text-sm font-bold text-white shadow-lg transition-all hover:bg-primary/90 focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {createLoading ? (
                      <>
                        <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">person_add</span>
                        Create Account
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ===== STEP 3: Success ===== */}
            {step === 'success' && (
              <div className="text-center space-y-6 py-4">
                <div className="flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 ring-4 ring-emerald-200 dark:ring-emerald-800 animate-in zoom-in-50 duration-500">
                    <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Account Created!</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Welcome, <strong>{patientRecord?.FirstName}</strong>! Your patient portal account has been created successfully.
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {email && <>A confirmation may be sent to <strong>{email}</strong>.</>}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full rounded-lg bg-primary py-3.5 text-center text-sm font-bold text-white shadow-lg transition-all hover:bg-primary/90 focus:ring-4 focus:ring-primary/30 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">login</span>
                  Go to Login
                </button>
              </div>
            )}

          </div>

          <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            Not a patient?{' '}
            <span className="font-medium text-slate-500 dark:text-slate-400">
              Staff & doctors are added by the hospital administrator.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
