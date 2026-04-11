import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/ui/StatCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '../services/billingService';

const statusColors = {
  Paid:    'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Partial: 'bg-orange-100 text-orange-700',
  Waived:  'bg-slate-100 text-slate-500',
};

const BillingManagement = () => {
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['all-bills'],
    queryFn: () => billingService.getAll(),
  });

  const markPaidMutation = useMutation({
    mutationFn: (billId) => billingService.updateStatus(billId, 'Paid'),
    onSuccess: () => queryClient.invalidateQueries(['all-bills']),
  });

  const paid    = bills.filter(b => b.paymentstatus === 'Paid').reduce((s, b) => s + parseFloat(b.totalamount || 0), 0);
  const pending = bills.filter(b => b.paymentstatus === 'Pending').reduce((s, b) => s + parseFloat(b.totalamount || 0), 0);
  const partial = bills.filter(b => b.paymentstatus === 'Partial').reduce((s, b) => s + parseFloat(b.totalamount || 0), 0);
  const total   = bills.reduce((s, b) => s + parseFloat(b.totalamount || 0), 0);

  const billingStats = [
    { title: 'Total Invoiced', value: `₹${total.toLocaleString()}`,   icon: 'payments',          color: 'blue',   trend: `${bills.length} bills` },
    { title: 'Paid',           value: `₹${paid.toLocaleString()}`,    icon: 'check_circle',       color: 'green',  trend: `${bills.filter(b => b.paymentstatus === 'Paid').length} bills` },
    { title: 'Pending',        value: `₹${pending.toLocaleString()}`, icon: 'pending',            color: 'yellow', trend: `${bills.filter(b => b.paymentstatus === 'Pending').length} bills` },
    { title: 'Partial',        value: `₹${partial.toLocaleString()}`, icon: 'partly_cloudy_day',  color: 'purple', trend: `${bills.filter(b => b.paymentstatus === 'Partial').length} bills` },
  ];

  return (
    <MainLayout title="Billing Management">
      <div className="space-y-10 animate-in fade-in duration-700">
        <header className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Billing Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage patient invoices, insurance claims, and payment statuses.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {billingStats.map((s) => <StatCard key={s.title} {...s} />)}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-5">Bill ID</th>
                  <th className="px-8 py-5">Patient</th>
                  <th className="px-8 py-5">Case</th>
                  <th className="px-8 py-5">Total</th>
                  <th className="px-8 py-5">Insurance</th>
                  <th className="px-8 py-5">Discount</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr><td colSpan="8" className="px-8 py-12 text-center text-slate-400">Loading bills...</td></tr>
                ) : bills.length === 0 ? (
                  <tr><td colSpan="8" className="px-8 py-12 text-center text-slate-400">No bills found.</td></tr>
                ) : (
                  bills.map((inv) => (
                    <React.Fragment key={inv.billid}>
                      <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all ${expandedId === inv.billid ? 'bg-primary/5 dark:bg-primary/10 border-l-[6px] border-primary' : ''}`}>
                        <td className="px-8 py-5 text-sm font-bold text-slate-500">#BILL-{inv.billid}</td>
                        <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white">
                          {inv.caserequest?.patient?.firstname} {inv.caserequest?.patient?.lastname}
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-400 uppercase">CAS-{inv.caserequestid}</td>
                        <td className="px-8 py-5 text-sm font-bold">₹{parseFloat(inv.totalamount).toLocaleString()}</td>
                        <td className="px-8 py-5 text-sm text-slate-500">₹{parseFloat(inv.insurancecovered || 0).toLocaleString()}</td>
                        <td className="px-8 py-5 text-sm text-slate-500">₹{parseFloat(inv.discount || 0).toLocaleString()}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[inv.paymentstatus] || 'bg-slate-100 text-slate-500'}`}>
                            {inv.paymentstatus}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button
                            onClick={() => setExpandedId(expandedId === inv.billid ? null : inv.billid)}
                            className={`p-2 rounded-xl transition-all ${expandedId === inv.billid ? 'bg-primary text-white rotate-180' : 'text-primary hover:bg-primary/5'}`}
                          >
                            <span className="material-symbols-outlined text-xl font-bold">keyboard_arrow_down</span>
                          </button>
                        </td>
                      </tr>
                      {expandedId === inv.billid && (
                        <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                          <td colSpan="8" className="px-12 py-8 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                              <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-primary/10 pb-2">Itemized Breakdown</h4>
                                {[
                                  ['Consultation Fee',  inv.consultationfee],
                                  ['Room Charges',      inv.roomcharges],
                                  ['Lab Charges',       inv.labcharges],
                                  ['Medicine Charges',  inv.medicinecharges],
                                  ['Other Charges',     inv.othercharges],
                                ].filter(([, v]) => parseFloat(v) > 0).map(([name, price]) => (
                                  <div key={name} className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                    <span className="font-medium">{name}</span>
                                    <span className="font-bold">₹{parseFloat(price).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-primary/20 shadow-xl text-right space-y-6">
                                <div>
                                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total Amount</p>
                                  <p className="text-5xl font-black text-primary">₹{parseFloat(inv.totalamount).toLocaleString()}</p>
                                </div>
                                <div className="flex gap-4 justify-end">
                                  {inv.paymentstatus !== 'Paid' && (
                                    <button
                                      onClick={() => markPaidMutation.mutate(inv.billid)}
                                      disabled={markPaidMutation.isPending}
                                      className="px-6 py-2.5 text-sm font-black bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                      <span className="material-symbols-outlined text-lg font-black">check_circle</span>
                                      {markPaidMutation.isPending ? 'Updating...' : 'Mark Paid'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>Showing {bills.length} invoice(s)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
          <div className="p-8 bg-primary/10 dark:bg-primary/20 rounded-3xl border border-primary/10 flex items-center gap-6 group hover:border-primary/40 transition-all cursor-pointer">
            <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20 group-hover:scale-110 transition-all">
              <span className="material-symbols-outlined text-3xl font-black">add</span>
            </div>
            <div>
              <h4 className="font-black text-xl text-primary">Generate Invoice</h4>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Create a new custom bill for outpatient or emergency services.</p>
            </div>
          </div>
          <div className="p-8 bg-slate-100 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-6 group hover:border-slate-400 transition-all cursor-pointer">
            <div className="size-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-all">
              <span className="material-symbols-outlined text-3xl font-black">file_download</span>
            </div>
            <div>
              <h4 className="font-black text-xl">Export Reports</h4>
              <p className="text-sm font-medium text-slate-500">Download current financial metrics in CSV/Excel formats.</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BillingManagement;
