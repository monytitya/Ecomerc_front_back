import React, { useEffect, useState } from 'react';
import { 
  Receipt, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  ChevronRight, 
  Loader2, 
  RefreshCw, 
  ArrowUpRight 
} from 'lucide-react';
import { paymentApi } from '../services/api';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const res = await paymentApi.getAll();
            setPayments(res.data.data || []);
        } catch (e) {
            console.error("Failed to load payments", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = payments.filter(p => 
        String(p.orderId || '').includes(search) ||
        String(p.transactionId || '').toLowerCase().includes(search.toLowerCase())
    );

    const totalAmount = filtered.reduce((sum, p) => sum + (p.amount || 0), 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Transactions</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">{filtered.length} successful & pending payments • Total: <span className="text-brand font-bold">${totalAmount.toLocaleString()}</span></p>
                </div>
                <button onClick={load} className="p-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-brand hover:border-brand/40 transition-all shadow-sm">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Volume', value: `$${totalAmount.toLocaleString()}`, icon: ArrowUpRight, color: 'text-brand', bg: 'bg-brand/5' },
                    { label: 'Completed', value: payments.filter(p => p.status === 'PAID').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Pending', value: payments.filter(p => p.status !== 'PAID').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map(card => (
                    <div key={card.label} className={`${card.bg} rounded-3xl p-6 border border-white shadow-sm flex items-center justify-between`}>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                            <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                        </div>
                        <card.icon className={`w-8 h-8 opacity-20 ${card.color}`} />
                    </div>
                ))}
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input 
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search invoice or reference #"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all"
                />
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-brand" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    {['Transaction', 'Invoice #', 'Amount', 'Date', 'Mode', 'Status', 'Ref No'].map(h => (
                                        <th key={h} className="px-6 py-5 font-bold text-slate-400 text-[10px] uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map((p, index) => (
                                    <tr key={p.id ?? p.transactionId ?? `payment-${index}`} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                                                    #{p.id ?? '—'}
                                                </div>
                                                <span className="font-bold text-slate-800">{p.transactionId || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-2 text-brand font-black">
                                                <Receipt className="w-4 h-4" />
                                                <span>Order #{p.orderId ?? '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-black text-slate-900">${p.amount?.toLocaleString()}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">{p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold ring-1 ring-inset ring-slate-200">
                                                <CreditCard className="w-3.5 h-3.5 mr-2" />
                                                {p.currency || 'KHQR'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            {p.status === 'PAID' ? (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-black">
                                                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> PAID
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 text-xs font-black">
                                                    <Clock className="w-4 h-4 mr-1.5" /> PENDING
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 font-mono text-xs font-bold text-slate-400">{p.transactionId || '—'}</td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-20 text-slate-400 font-bold">No transactions found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Payments;
