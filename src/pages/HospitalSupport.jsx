import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useToastStore } from '../store/toastStore';

const supportCategories = [
  { id: 'billing', title: 'Billing Enquiries', icon: 'account_balance_wallet', color: 'blue', description: 'Questions about insurance, bills or payments.' },
  { id: 'appointment', title: 'Appointments', icon: 'event', color: 'emerald', description: 'Schedule or reschedule your medical visits.' },
  { id: 'technical', title: 'Technical Help', icon: 'dvr', color: 'purple', description: 'Issues with your portal account or navigation.' },
  { id: 'emergency', title: 'Emergency Services', icon: 'emergency', color: 'rose', description: 'Immediate assistance for critical situations.' }
];

const HospitalSupport = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToastStore();

  const handleMockSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.addToast('Your assistance request has been logged. A representative will contact you soon.', 'success');
      e.target.reset();
    }, 1500);
  };

  return (
    <MainLayout title="Hospital Support" hidePadding={true}>
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-10 animate-in fade-in duration-700">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Emergency Support Banner */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl group transition-all duration-500">
            <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-8">
                <div className="size-20 bg-rose-500/10 rounded-3xl flex items-center justify-center border border-rose-500/20 group-hover:scale-105 transition-all duration-500">
                  <span className="material-symbols-outlined text-4xl text-rose-500">emergency</span>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Need immediate assistance?</h2>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">Emergency Department • Trauma Center • 24/7</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center md:items-end gap-2">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-1">Direct Line</span>
                <p className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none hover:text-rose-400 transition-colors cursor-pointer">+1 800 248 0000</p>
                <div className="flex items-center gap-4 mt-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    On Call
                  </span>
                  <div className="h-4 w-px bg-slate-700"></div>
                  <button className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors">Find a Hospital Near You</button>
                </div>
              </div>
            </div>
            
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-500/5 rounded-full -translate-y-1/2 blur-3xl pointer-events-none"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Support Categories */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">How can we help you today?</h3>
                <p className="text-slate-500 mt-1 font-medium italic">Select a category to reach the specialized assistance desk.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {supportCategories.map((cat) => (
                  <button 
                    key={cat.id}
                    className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-premium transition-all text-left flex items-start gap-4 group"
                  >
                    <div className={`size-14 rounded-2xl bg-${cat.color}-100 dark:bg-${cat.color}-900/30 flex items-center justify-center text-${cat.color}-600 group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-slate-100 text-lg mb-1">{cat.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed leading-tight">{cat.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Assistance Request Mock Form */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 md:p-10 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                   <h4 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-6 flex items-center gap-3">
                     <span className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                       <span className="material-symbols-outlined text-lg">mail_lock</span>
                     </span>
                     Send a Secure Message
                   </h4>
                   <form onSubmit={handleMockSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Subject</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none">
                          <option>General Support</option>
                          <option>Billing Dispute</option>
                          <option>Departmental Enquiry</option>
                          <option>Feedback & Suggestions</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Urgency</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none">
                          <option>Normal</option>
                          <option>Urgent</option>
                          <option>Immediate Assistance Required</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Your Message</label>
                        <textarea 
                          rows="4" 
                          required
                          placeholder="Please describe your enquiry in detail..."
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                        ></textarea>
                      </div>
                      <div className="md:col-span-2 pt-2">
                        <button 
                          disabled={isSubmitting}
                          className="w-full py-5 bg-slate-900 dark:bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                              Dispatching Request...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm font-black">send</span>
                              Submit Request
                            </>
                          )}
                        </button>
                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase mt-4 tracking-tighter">Your message is securely encrypted and routed to the central management desk.</p>
                      </div>
                   </form>
                </div>
              </div>
            </div>

            {/* Side Info */}
            <div className="space-y-8">
              <div className="bg-primary/5 dark:bg-primary/10 rounded-[2rem] p-8 border border-primary/10 space-y-6">
                <h4 className="text-lg font-black text-primary">Department Extensions</h4>
                <div className="space-y-4">
                  {[
                    { name: 'Cardiology Desk', ext: '101' },
                    { name: 'Neurology Desk', ext: '102' },
                    { name: 'Pharmacy (Main)', ext: '405' },
                    { name: 'Radiology Support', ext: '302' },
                    { name: 'Front Desk / Reception', ext: '0' }
                  ].map((dept) => (
                    <div key={dept.name} className="flex items-center justify-between py-3 border-b border-primary/5">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{dept.name}</span>
                      <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs font-black text-primary font-mono select-all">+{dept.ext}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <span className="material-symbols-outlined text-3xl mb-4 text-emerald-400">shield_with_heart</span>
                  <h4 className="text-xl font-black mb-2">Patient Privacy</h4>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed">
                    Our support team is fully trained in HIPAA and medical data privacy standards. Your identity and health records are never exposed during support interactions.
                  </p>
                </div>
                <div className="absolute -bottom-10 -right-10 size-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default HospitalSupport;
