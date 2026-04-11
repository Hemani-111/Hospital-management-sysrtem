import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import MainLayout from '../layouts/MainLayout';
import { patientService } from '../services/patientService';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';

const patientSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  emergencyContact: z.string().min(5, 'Emergency contact info is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
  policyNumber: z.string().optional(),
});

const CreatePatient = () => {
  const { session } = useAuthStore();
  const userEmail = session?.user?.email;

  const { data: profile } = useQuery({
    queryKey: ['my-profile', userEmail],
    queryFn: () => employeeService.getProfileByEmail(userEmail),
    enabled: !!userEmail,
  });
  const employeeId = profile?.employeeid;

  const [success, setSuccess] = useState(false);
  const [signupCode, setSignupCode] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: { gender: 'Male', bloodGroup: 'A+' }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const code = `HX-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;

      const patientData = {
        firstname: data.firstName,
        lastname: data.lastName,
        dateofbirth: data.dob,
        gender: data.gender,
        phonenumber: data.phone,
        emergencycontact: data.emergencyContact,
        bloodgroup: data.bloodGroup,
        addressline1: data.address,
        city: data.city,
        state: data.state,
        postalcode: data.pincode,
        signupcode: code,
        isregistered: false,
        createdbyadminid: profile?.employeeid || 1,
      };

      await patientService.create(patientData);
      setSignupCode(code);
      setSuccess(true);
      reset();
    } catch (err) {
      alert(`Error creating patient: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <MainLayout title="Register Patient">
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 text-center">
              <div className="size-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-4xl font-black">check_circle</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Patient Registered!</h3>
              <p className="text-slate-500 font-medium mb-8">Profile created successfully. Share this signup code with the patient.</p>
              <div className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-8">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-black">Signup Code</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-4xl font-mono font-black tracking-wider text-primary">{signupCode}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(signupCode)}
                    className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors active:scale-95"
                  >
                    <span className="material-symbols-outlined font-black">content_copy</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setSuccess(false)}
                  className="w-full py-4 bg-primary text-white rounded-xl font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  Register Another
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="w-full py-4 border border-slate-200 dark:border-slate-700 rounded-xl font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Create Patient Profile">
      <div className="max-w-5xl mx-auto animate-in fade-in duration-700">
        <header className="mb-8">
          <nav aria-label="Breadcrumb" className="flex text-sm text-slate-500 dark:text-slate-400 mb-2">
            <ol className="flex items-center space-x-2">
              <li><span className="hover:text-primary cursor-pointer">Admin</span></li>
              <li><span className="material-symbols-outlined text-sm">chevron_right</span></li>
              <li className="text-slate-900 dark:text-slate-100 font-medium">Create Patient</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create New Patient Profile</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Register a new patient and generate their secure access code.</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-12">
          <div className="p-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Personal Section */}
              <div className="space-y-6">
                <h2 className="text-lg font-black text-primary border-b border-slate-100 dark:border-slate-800 pb-2 uppercase tracking-widest">Personal Info</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">First Name *</label>
                    <input {...register('firstName')} placeholder="e.g. John" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 outline-none transition-all p-3" />
                    {errors.firstName && <p className="text-[10px] text-red-500 font-bold">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">Last Name *</label>
                    <input {...register('lastName')} placeholder="e.g. Doe" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 outline-none transition-all p-3" />
                    {errors.lastName && <p className="text-[10px] text-red-500 font-bold">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">Date of Birth *</label>
                    <input type="date" {...register('dob')} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 outline-none p-3" />
                    {errors.dob && <p className="text-[10px] text-red-500 font-bold">{errors.dob.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">Gender *</label>
                    <select {...register('gender')} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 outline-none p-3">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">Blood Group *</label>
                  <select {...register('bloodGroup')} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 outline-none p-3">
                    {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">Phone Number *</label>
                  <input {...register('phone')} placeholder="+91 XXXXXXXXXX" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 outline-none p-3" />
                  {errors.phone && <p className="text-[10px] text-red-500 font-bold">{errors.phone.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">Emergency Contact *</label>
                  <input {...register('emergencyContact')} placeholder="Name & Phone" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 outline-none p-3" />
                  {errors.emergencyContact && <p className="text-[10px] text-red-500 font-bold">{errors.emergencyContact.message}</p>}
                </div>
              </div>

              {/* Address & Insurance */}
              <div className="space-y-6">
                <h2 className="text-lg font-black text-primary border-b border-slate-100 dark:border-slate-800 pb-2 uppercase tracking-widest">Address & Insurance</h2>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">Full Address *</label>
                  <input {...register('address')} placeholder="Street, Area..." className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 outline-none p-3" />
                  {errors.address && <p className="text-[10px] text-red-500 font-bold">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">City *</label>
                    <input {...register('city')} placeholder="Mumbai" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 outline-none p-3" />
                    {errors.city && <p className="text-[10px] text-red-500 font-bold">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">State *</label>
                    <input {...register('state')} placeholder="Maharashtra" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 outline-none p-3" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">Pincode *</label>
                    <input {...register('pincode')} placeholder="400001" maxLength={6} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 outline-none p-3" />
                    {errors.pincode && <p className="text-[10px] text-red-500 font-bold">{errors.pincode.message}</p>}
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">Insurance Policy # (Optional)</label>
                    <input {...register('policyNumber')} placeholder="e.g. STAR-2024-XXXX" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 outline-none p-3" />
                  </div>
                </div>

                {/* Preview Card */}
                <div className="mt-4 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-3">What happens next?</h4>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">check</span> Patient record is created in the system</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">check</span> A unique Signup Code is generated</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">check</span> Patient uses the code to self-register login</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-4 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => window.history.back()} className="px-5 py-3 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-3 bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="animate-spin material-symbols-outlined font-black">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined font-black">person_add</span>
              )}
              {loading ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default CreatePatient;
