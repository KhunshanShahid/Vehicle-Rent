
import React, { useState } from 'react';
import { Receipt, Search, Filter, ArrowUpRight, ArrowDownLeft, DollarSign, Wallet } from 'lucide-react';
import { useRentFlowStore } from '../store';
import { PaymentMethod } from '../types';

const Transactions: React.FC = () => {
  const { transactions, bookings, customers } = useRentFlowStore();
  const [searchTerm, setSearchTerm] = useState('');

  const getCustomerName = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return 'N/A';
    const customer = customers.find(c => c.id === booking.customerId);
    return customer?.name || 'N/A';
  };

  const stats = [
    { label: 'Total Revenue', value: transactions.filter(t => t.type !== 'REFUND' && t.type !== 'DEPOSIT').reduce((acc, t) => acc + t.amount, 0), icon: DollarSign, color: 'blue' },
    { label: 'Held Deposits', value: transactions.filter(t => t.type === 'DEPOSIT').reduce((acc, t) => acc + t.amount, 0), icon: Wallet, color: 'amber' },
    { label: 'Refunded', value: transactions.filter(t => t.type === 'REFUND').reduce((acc, t) => acc + t.amount, 0), icon: ArrowDownLeft, color: 'red' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Ledger</h1>
          <p className="text-gray-500">Real-time cash flow and payment tracking.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
             Export CSV
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">${stat.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by note or transaction ID..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Filter size={16} /> All Methods
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer / Ref</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{new Date(t.date).toLocaleDateString()}</p>
                    <p className="text-[10px] text-gray-400 uppercase">{new Date(t.date).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">{getCustomerName(t.bookingId)}</p>
                    <p className="text-xs text-gray-500 italic truncate max-w-[200px]">{t.note}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                      t.type === 'REFUND' ? 'bg-red-50 text-red-600 border-red-100' :
                      t.type === 'DEPOSIT' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {t.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-medium text-gray-600">{t.method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className={`text-sm font-bold ${t.type === 'REFUND' ? 'text-red-600' : 'text-gray-900'}`}>
                      {t.type === 'REFUND' ? '-' : ''}${t.amount.toLocaleString()}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
