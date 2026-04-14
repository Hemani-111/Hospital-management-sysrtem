import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { patientPortalService } from '../services/patientPortalService';
import { billingService } from '../services/billingService';
import { useToastStore } from '../store/toastStore';

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

  const [payingId, setPayingId] = React.useState(null);

  const handlePay = async (billId) => {
    setPayingId(billId);
    try {
      // Simulate payment gateway delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      await billingService.updateStatus(billId, 'Paid');
      await refetch();
      addToast('Payment successful! Your record has been updated.', 'success');
    } catch (err) {
      addToast(`Payment failed: ${err.message}`, 'error');
    } finally {
      setPayingId(null);
    }
  };

  const pendingAmount = bills
    .filter(b => b.paymentstatus !== 'Paid')
    .reduce((s, b) => s + parseFloat(b.totalamount || 0), 0);

  if (isLoading) {
    return (
      <MainLayout title="Patient Billing" hidePadding={true}>
        <div className="flex items-center justify-center min-h-screen">
          <span className="animate-spin material-symbols-outlined text-4xl text-primary">progress_activity</span>
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
            <div className="text-center py-20 text-slate-400">
              <span className="material-symbols-outlined text-6xl mb-4 block">receipt_long</span>
              <p className="font-bold text-lg">No bills found.</p>
              <p className="text-sm mt-1">Your billing records will appear here once generated.</p>
            </div>
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
                        <button
                          onClick={() => handlePay(bill.billid)}
                          disabled={payingId === bill.billid}
                          className="w-full bg-primary text-white py-3.5 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {payingId === bill.billid ? (
                            <>
                              <span className="animate-spin material-symbols-outlined text-sm font-black">progress_activity</span>
                              Processing...
                            </>
                          ) : (
                            'Proceed to Pay'
                          )}
                        </button>
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
        </div>
      </div>
    </MainLayout>
  );
};

export default PatientBills;
