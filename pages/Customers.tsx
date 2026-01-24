
import React, { useState } from 'react';
import { Users, Search, Plus, Mail, Phone, FileText, ExternalLink } from 'lucide-react';
import { useRentFlowStore } from '../store';

const Customers: React.FC = () => {
  const { customers, bookings, addCustomer } = useRentFlowStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', licenseNumber: '', notes: '' });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer(newCustomer);
    setIsModalOpen(false);
    setNewCustomer({ name: '', email: '', phone: '', licenseNumber: '', notes: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Registry</h1>
          <p className="text-gray-500">View history, license info, and contact details.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCustomers.map((customer) => {
          const customerBookings = bookings.filter(b => b.customerId === customer.id);
          return (
            <div key={customer.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-100 transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-400 group-hover:from-blue-50 group-hover:to-blue-100 group-hover:text-blue-500 transition-all">
                    <Users size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{customer.name}</h3>
                    <p className="text-sm text-gray-500 font-medium">Customer since {new Date(customer.createdAt).getFullYear()}</p>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                  <ExternalLink size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail size={16} className="text-gray-400" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone size={16} className="text-gray-400" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <FileText size={16} className="text-gray-400" />
                    <span className="font-mono text-xs uppercase font-bold tracking-wider">{customer.licenseNumber}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-center text-center">
                  <p className="text-2xl font-bold text-gray-900">{customerBookings.length}</p>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Total Rentals</p>
                </div>
              </div>

              {customer.notes && (
                <div className="mt-6 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">
                  <span className="font-bold uppercase mr-2 text-amber-800">Note:</span> {customer.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold">New Customer Profile</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Full Name</label>
                <input required type="text" className="w-full px-4 py-2 bg-gray-50 border rounded-xl" placeholder="John Doe" 
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Email</label>
                  <input required type="email" className="w-full px-4 py-2 bg-gray-50 border rounded-xl" placeholder="john@example.com"
                    onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Phone</label>
                  <input required type="tel" className="w-full px-4 py-2 bg-gray-50 border rounded-xl" placeholder="555-0199"
                    onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Driving License #</label>
                <input required type="text" className="w-full px-4 py-2 bg-gray-50 border rounded-xl" placeholder="DL-882211"
                  onChange={e => setNewCustomer({...newCustomer, licenseNumber: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Internal Notes</label>
                <textarea className="w-full px-4 py-2 bg-gray-50 border rounded-xl min-h-[100px]" placeholder="Add any special requirements or notes..."
                  onChange={e => setNewCustomer({...newCustomer, notes: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl mt-4 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                Save Customer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
