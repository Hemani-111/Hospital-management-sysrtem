import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { patientPortalService } from '../services/patientPortalService';
import { billingService } from '../services/billingService';
import { useToastStore } from '../store/toastStore';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const PatientBills = () => {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const userEmail = session?.user?.email;

  const { data: patient } = useQuery({
    queryKey: ['patient-profile', userEmail],
    queryFn: () => patientPortalService.getProfileByEmail(userEmail),
    enabled: !!userEmail,
  });

  const { data: bills = [], isLoading, refetch } = useQuery({
    queryKey: ['patient-bills-detail', patient?.patientid],
    queryFn: () => billingService.getByPatient(patient.patientid),
    enabled: !!patient?.patientid,
  });

  const [selectedBill, setSelectedBill] = React.useState(null);
  const [showPayModal, setShowPayModal] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const [payingId, setPayingId] = React.useState(null);

  const handlePay = async () => {
    if (!selectedBill) return;
    setIsProcessing(true);
    try {
      // Simulate bank authentication delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      await billingService.updateStatus(selectedBill.billid, 'Paid');
      await refetch();
      addToast('Payment successfully processed! Digital receipt generated.', 'success');
      setShowPayModal(false);
      setSelectedBill(null);
    } catch (err) {
      addToast(`Transaction failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingAmount = bills
    .filter(b => b.paymentstatus !== 'Paid')
    .reduce((s, b) => s + parseFloat(b.totalamount || 0), 0);

  if (isLoading) {
    return (
      <MainLayout title="Patient Billing" hidePadding={true}>
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
          <Skeleton variant="card" className="h-40 rounded-2xl" />
          <Skeleton variant="card" className="h-[200px] rounded-3xl" />
          <Skeleton variant="card" className="h-[200px] rounded-3xl" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Patient Billing" hidePadding={true}>
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-primary/10 bg-white/80 dark:bg-slate-900/80 px-4 md:px-10 py-3 backdrop-blur-md no-print">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center size-10 rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100">Patient Billing</h2>
            <p className="text-xs text-slate-500">Hospital Management System</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-background-light dark:bg-slate-950 p-4 md:p-8 animate-in fade-in duration-700 min-h-[calc(100vh-64px)]">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Branded Print Header (Stays at TOP of PDF) */}
          <div className="print-only">
            <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-primary">
              <div>
                <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Hospital System</h1>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Official Billing Statement</p>
              </div>
              <div className="text-right">
                <p className="font-black text-sm uppercase">Date: {new Date().toLocaleDateString()}</p>
                <p className="text-xs text-slate-500 font-bold">Patient ID: #{patient?.patientid}</p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-xl mb-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Patient Details</p>
              <p className="text-lg font-black text-slate-900">{patient?.firstname} {patient?.lastname}</p>
              <p className="text-sm font-bold text-slate-500 italic">Electronic billing record verified via SupraBase.</p>
            </div>
          </div>


          {/* Outstanding Banner */}
          {pendingAmount > 0 && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 to-primary p-6 text-white shadow-xl shadow-rose-500/20 no-print">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                    <span className="material-symbols-outlined text-3xl">priority_high</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">₹{pendingAmount.toLocaleString()} Outstanding</h3>
                    <p className="text-white/80 text-sm">Action required: Please settle your pending balance.</p>
                  </div>
                </div>
                <button
                  onClick={() => addToast('Feature: Selecting all pending bills for bulk payment...', 'success')}
                  className="bg-white text-rose-500 px-8 py-3 rounded-xl font-black hover:bg-slate-50 transition-all shadow-lg active:scale-95"
                >
                  Pay All Items
                </button>
              </div>
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>
          )}

          {/* No Bills */}
          {bills.length === 0 && (
            <EmptyState 
              title="No bills found" 
              description="Your medical billing history is currently clear. Any future invoices will be listed here."
              icon="receipt_long"
              className="py-20"
            />
          )}

          {/* Bill Cards */}
          {bills.map((bill) => (
            <div key={bill.billid} className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">Bill #{bill.billid}</h1>
                  <p className="text-slate-500 flex items-center gap-2 text-sm font-medium">
                    <span className="material-symbols-outlined text-[16px]">tag</span>
                    Case Reference: #{bill.caserequestid}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`px-3 py-1 rounded-full font-black uppercase tracking-widest text-[10px] ${
                    bill.paymentstatus === 'Paid' ? 'bg-green-100 text-green-700' :
                    bill.paymentstatus === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>{bill.paymentstatus}</span>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-bold text-[10px] uppercase tracking-widest">
                    Issued: {new Date(bill.generatedon).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    <div className="md:col-span-2 space-y-6">
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Billing Summary</p>
                      <div className="relative h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        {parseFloat(bill.insurancecovered) > 0 && (
                          <div
                            className="h-full bg-primary/40"
                            style={{ width: `${(parseFloat(bill.insurancecovered) / parseFloat(bill.totalamount)) * 100}%` }}
                            title="Insurance Covered"
                          />
                        )}
                        <div className="h-full bg-primary flex-1" title="Patient Responsibility" />
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Total</p>
                          <p className="text-xl font-bold text-slate-800 dark:text-slate-200">₹{parseFloat(bill.totalamount).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1 border-x border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Insurance</p>
                          <p className="text-xl font-bold text-slate-400">₹{parseFloat(bill.insurancecovered || 0).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-primary uppercase font-black tracking-widest">Payable</p>
                          <p className="text-2xl font-black text-primary">
                            ₹{(parseFloat(bill.totalamount) - parseFloat(bill.insurancecovered || 0) - parseFloat(bill.discount || 0)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 border border-primary/10 no-print">
                      <div className="size-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                        <span className="material-symbols-outlined font-black">payments</span>
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Net Payable</p>
                        <p className="text-2xl font-black text-primary">
                          ₹{(parseFloat(bill.totalamount) - parseFloat(bill.insurancecovered || 0) - parseFloat(bill.discount || 0)).toLocaleString()}
                        </p>
                      </div>
                      {bill.paymentstatus !== 'Paid' && (
                        <div className="w-full flex flex-col gap-2">
                          <button
                            onClick={() => { setSelectedBill(bill); setShowPayModal(true); }}
                            className="w-full bg-primary text-white py-3.5 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                            Proceed to Pay
                          </button>
                          <button
                            onClick={() => setSelectedBill(bill)}
                            className="w-full bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all"
                          >
                            View Details
                          </button>
                        </div>
                      )}
                      {bill.paymentstatus === 'Paid' && (
                        <div className="w-full bg-green-500/10 text-green-500 py-3.5 rounded-xl font-black flex items-center justify-center gap-2 border border-green-500/20">
                          <span className="material-symbols-outlined text-sm font-black">check_circle</span>
                          Paid
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Action Footer */}
          {bills.length > 0 && (
            <>
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-end gap-4 mt-8 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-primary hover:bg-primary/5 transition-all font-black uppercase tracking-widest text-[10px] border border-primary/10"
                >
                  <span className="material-symbols-outlined text-[16px] font-black">download</span> Download Statement
                </button>
              </div>
            </>
          )}

          {/* Bill Details Modal */}
          {selectedBill && !showPayModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden relative">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tighter uppercase">Bill Breakdown</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Case: #{selectedBill.caserequestid}</p>
                    </div>
                    <button onClick={() => setSelectedBill(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:rotate-90 transition-all">
                      <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: 'Consultation Fee', value: selectedBill.consultationfee },
                      { label: 'Room & Board', value: selectedBill.roomcharges },
                      { label: 'Laboratory Tests', value: selectedBill.labcharges },
                      { label: 'Pharmacy/Medicine', value: selectedBill.medicinecharges },
                      { label: 'Other Diagnostics', value: selectedBill.othercharges }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest text-[10px]">{item.label}</span>
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100 italic">₹{parseFloat(item.value || 0).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="pt-4 flex justify-between items-center">
                      <span className="text-xs font-black text-primary uppercase tracking-widest">Total Charges</span>
                      <span className="text-2xl font-black text-primary tracking-tighter">₹{parseFloat(selectedBill.totalamount).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-10 grid grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Insurance Paid</p>
                        <p className="text-lg font-black text-slate-500">₹{parseFloat(selectedBill.insurancecovered || 0).toLocaleString()}</p>
                     </div>
                     <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Due from You</p>
                        <p className="text-lg font-black text-primary">₹{(parseFloat(selectedBill.totalamount) - parseFloat(selectedBill.insurancecovered || 0) - parseFloat(selectedBill.discount || 0)).toLocaleString()}</p>
                     </div>
                  </div>

                  <button 
                    onClick={() => setShowPayModal(true)}
                    className="w-full mt-8 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
                  >
                    Confirm & Proceed to Pay
                  </button>
                </div>
                <div className="absolute top-0 right-0 size-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              </div>
            </div>
          )}

          {/* Premium Mock Checkout Modal */}
          {showPayModal && selectedBill && (
             <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full shadow-2xl animate-in slide-in-from-bottom-10 duration-500 border border-white/20">
                  <div className="flex flex-col items-center">
                    <div className="w-full h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 mb-8 relative overflow-hidden shadow-2xl flex flex-col justify-between text-white">
                       <div className="flex justify-between items-start">
                          <span className="material-symbols-outlined text-4xl text-white/20">contactless</span>
                          <span className="text-xs font-black tracking-widest opacity-50 uppercase">Secured Gateway</span>
                       </div>
                       <div>
                          <p className="text-sm font-bold tracking-[0.3em] mb-4">**** **** **** 8821</p>
                          <div className="flex justify-between items-end">
                             <div>
                                <p className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Expiry</p>
                                <p className="text-[10px] font-black">12/28</p>
                             </div>
                             <div className="flex -space-x-3">
                                <div className="size-8 bg-red-500/80 rounded-full blur-[1px]"></div>
                                <div className="size-8 bg-amber-500/80 rounded-full blur-[1px]"></div>
                             </div>
                          </div>
                       </div>
                       <div className="absolute top-0 right-0 size-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    </div>

                    <div className="w-full space-y-6">
                       <div className="text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Paying Amount</p>
                          <h4 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">₹{(parseFloat(selectedBill.totalamount) - parseFloat(selectedBill.insurancecovered || 0) - parseFloat(selectedBill.discount || 0)).toLocaleString()}</h4>
                       </div>

                       <div className="space-y-4">
                          <input type="password" placeholder="CVV / Security Code" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 text-center text-sm font-black tracking-widest focus:ring-2 focus:ring-primary/20 outline-none" />
                          <button 
                            onClick={handlePay}
                            disabled={isProcessing}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                          >
                            {isProcessing ? (
                              <>
                                <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                                Verifying Transaction...
                              </>
                            ) : (
                              'Authorize Payment'
                            )}
                          </button>
                       </div>
                    </div>

                    <button 
                      onClick={() => { setShowPayModal(false); if(isProcessing) return; }} 
                      disabled={isProcessing}
                      className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-0"
                    >
                      Cancel Transaction
                    </button>
                  </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PatientBills;
