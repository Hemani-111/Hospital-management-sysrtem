import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/ui/StatCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '../services/billingService';
import { useToastStore } from '../store/toastStore';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

const statusColors = {
  Paid:    'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Partial: 'bg-orange-100 text-orange-700',
  Waived:  'bg-slate-100 text-slate-500',
};

const BillingManagement = () => {
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const { data: unbilled = [] } = useQuery({
    queryKey: ['unbilled-cases'],
    queryFn: () => billingService.getUnbilledCases(),
  });

  const generateMutation = useMutation({
    mutationFn: (caseId) => billingService.generateBill(caseId),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-bills']);
      queryClient.invalidateQueries(['unbilled-cases']);
      setIsModalOpen(false);
      addToast('Bill generated successfully!', 'success');
    },
    onError: (err) => addToast(`Error generating bill: ${err.message}`, 'error')
  });

  const queryClientRef = queryClient;

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['all-bills'],
    queryFn: () => billingService.getAll(),
  });

  const filteredBills = (bills || []).filter(bill => {
    const patientName = `${bill.caserequest?.patient?.firstname} ${bill.caserequest?.patient?.lastname}`.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) || 
                          bill.billid.toString().includes(searchTerm) ||
                          bill.caserequestid.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'All' || bill.paymentstatus === statusFilter;

    return matchesSearch && matchesStatus;
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
        {/* Branded Print Header for Reports (Stays at TOP of PDF) */}
        <div className="print-only mb-10">
          <div className="flex justify-between items-center pb-6 border-b-2 border-primary mb-8">
            <div>
              <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Hospital System</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Administrative Financial Report</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black uppercase tracking-widest">{new Date().toLocaleDateString()}</p>
              <p className="text-xs text-slate-400 font-bold tracking-widest">Confidential Data — System Export</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-6 mb-10">
             {billingStats.map(s => (
               <div key={s.title} className="p-4 border border-slate-100 rounded-xl">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.title}</p>
                 <p className="text-xl font-black text-slate-900">{s.value}</p>
               </div>
             ))}
          </div>
        </div>

        <header className="mb-8 no-print">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Billing Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage patient invoices, insurance claims, and payment statuses.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4 no-print">
          <div onClick={() => setIsModalOpen(true)} className="p-8 bg-primary/10 dark:bg-primary/20 rounded-3xl border border-primary/10 flex items-center gap-6 group hover:border-primary/40 transition-all cursor-pointer">
            <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20 group-hover:scale-110 transition-all">
              <span className="material-symbols-outlined text-3xl font-black">add</span>
            </div>
            <div>
              <h4 className="font-black text-xl text-primary">Generate Final Bill</h4>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Compile lab, room, and consultation charges for resolved cases.</p>
            </div>
          </div>
          <div
            onClick={() => window.print()} 
            className="p-8 bg-slate-100 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-6 group hover:border-slate-400 transition-all cursor-pointer no-print"
          >
            <div className="size-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-all">
              <span className="material-symbols-outlined text-3xl font-black">file_download</span>
            </div>
            <div>
              <h4 className="font-black text-xl">Export Reports</h4>
              <p className="text-sm font-medium text-slate-500">Download current financial metrics in PDF format.</p>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-6 no-print bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex-1 min-w-[300px] relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
              <input 
                type="text"
                placeholder="Search bills by patient name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
              />
           </div>
           <div className="flex gap-3">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-sm font-black text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 outline-none uppercase tracking-widest cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Waived">Waived</option>
              </select>
              <button 
                onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
                className="p-3 text-slate-400 hover:text-primary transition-colors"
                title="Reset Filters"
              >
                <span className="material-symbols-outlined">restart_alt</span>
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
          {billingStats.map((s) => <StatCard key={s.title} {...s} />)}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-12">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[1100px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-5">Bill ID</th>
                  <th className="px-8 py-5">Patient</th>
                  <th className="px-8 py-5">Case</th>
                  <th className="px-8 py-5">Total</th>
                  <th className="px-8 py-5">Insurance</th>
                  <th className="px-8 py-5">Discount</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 no-print"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan="8" className="p-0">
                        <Skeleton variant="table-row" />
                      </td>
                    </tr>
                  ))
                ) : filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <EmptyState 
                        title="No invoices found" 
                        description={searchTerm ? `No bills match your search for "${searchTerm}"` : "There are no generated bills in the system yet."}
                        icon="receipt_long"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((inv) => (
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
                        <td className="px-8 py-5 text-right no-print">
                          <button
                            onClick={() => setExpandedId(expandedId === inv.billid ? null : inv.billid)}
                            className={`p-2 rounded-xl transition-all ${expandedId === inv.billid ? 'bg-primary text-white rotate-180' : 'text-primary hover:bg-primary/5'}`}
                          >
                            <span className="material-symbols-outlined text-xl font-bold">keyboard_arrow_down</span>
                          </button>
                        </td>
                      </tr>
                      {expandedId === inv.billid && (
                        <tr className="bg-slate-50/50 dark:bg-slate-800/20 no-print">
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
          <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest no-print">
            <span>Showing {filteredBills.length} invoice(s)</span>
          </div>
        </div>
      </div>


      {/* Generate Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Generate Final Bill</h3>
                <p className="text-sm text-slate-500">Select a resolved case to automatically compile charges.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                <span className="material-symbols-outlined font-black text-slate-500">close</span>
              </button>
            </div>
            <div className="p-8">
              {unbilled.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">check_circle</span>
                  <p className="text-lg font-bold text-slate-500">No cases waiting to be billed.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  {unbilled.map(c => (
                    <div key={c.caserequestid} className="p-6 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div>
                        <p className="font-black text-slate-900 dark:text-white text-lg">{c.firstname} {c.lastname}</p>
                        <p className="text-sm text-slate-500 font-bold mb-2">CAS-{c.caserequestid} • {new Date(c.createdon).toLocaleDateString()}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 max-w-sm">{c.casesummary}</p>
                      </div>
                      <button
                        onClick={() => generateMutation.mutate(c.caserequestid)}
                        disabled={generateMutation.isPending}
                        className="px-6 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {generateMutation.isPending ? 'Calculating...' : 'Compile Bill'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default BillingManagement;
