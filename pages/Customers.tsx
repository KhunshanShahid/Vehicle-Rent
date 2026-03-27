
import React, { useState, useMemo } from 'react';
import { Users, Search, Plus, Mail, Phone, FileText, ExternalLink, Award, TrendingUp, Car } from 'lucide-react';
import { useRentFlowStore } from '../store';
import { Booking, Vehicle, VehicleCategory } from '../types';

const Customers: React.FC = () => {
  const { customers, bookings, vehicles, addCustomer, settings } = useRentFlowStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', licenseNumber: '', notes: '' });

  const getCustomerSegment = (totalSpent: number, rentalCount: number) => {
    if (totalSpent > 5000 || rentalCount > 10) return { label: 'Elite', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Award size={14} /> };
    if (totalSpent > 2000 || rentalCount > 5) return { label: 'VIP', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Award size={14} /> };
    if (rentalCount >= 3) return { label: 'Frequent', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <TrendingUp size={14} /> };
    if (rentalCount >= 1) return { label: 'Regular', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <Users size={14} /> };
    return { label: 'New', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: <Plus size={14} /> };
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!selectedSegment) return matchesSearch;

    const customerBookings = bookings.filter(b => b.customerId === c.id);
    const totalSpent = customerBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const rentalCount = customerBookings.length;
    const segment = getCustomerSegment(totalSpent, rentalCount);
    
    return matchesSearch && segment.label === selectedSegment;
  });

  const segmentStats = useMemo(() => {
    const stats = {
      Elite: 0,
      VIP: 0,
      Frequent: 0,
      Regular: 0,
      New: 0
    };

    customers.forEach(customer => {
      const customerBookings = bookings.filter(b => b.customerId === customer.id);
      const totalSpent = customerBookings.reduce((sum, b) => sum + b.totalAmount, 0);
      const rentalCount = customerBookings.length;
      const segment = getCustomerSegment(totalSpent, rentalCount);
      stats[segment.label as keyof typeof stats]++;
    });

    return stats;
  }, [customers, bookings]);

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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Elite', count: segmentStats.Elite, color: 'bg-purple-50 text-purple-600 border-purple-100', icon: <Award size={18} /> },
          { label: 'VIP', count: segmentStats.VIP, color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Award size={18} /> },
          { label: 'Frequent', count: segmentStats.Frequent, color: 'bg-blue-50 text-blue-600 border-blue-100', icon: <TrendingUp size={18} /> },
          { label: 'Regular', count: segmentStats.Regular, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <Users size={18} /> },
          { label: 'New', count: segmentStats.New, color: 'bg-gray-50 text-gray-600 border-gray-100', icon: <Plus size={18} /> },
        ].map((stat) => (
          <button 
            key={stat.label} 
            onClick={() => setSelectedSegment(selectedSegment === stat.label ? null : stat.label)}
            className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center shadow-sm ${
              selectedSegment === stat.label 
                ? `${stat.color.replace('bg-', 'bg-opacity-100 bg-').replace('text-', 'text-white text-')} ring-2 ring-offset-2 ring-blue-500` 
                : stat.color
            }`}
          >
            <div className="mb-1">{stat.icon}</div>
            <p className="text-xl font-black">{stat.count}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{stat.label}</p>
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {selectedSegment && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Filter:</span>
            <button 
              onClick={() => setSelectedSegment(null)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-black uppercase border border-blue-100 hover:bg-blue-100 transition-all"
            >
              {selectedSegment}
              <Plus className="rotate-45" size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCustomers.map((customer) => {
          const customerBookings = bookings.filter(b => b.customerId === customer.id);
          const totalSpent = customerBookings.reduce((sum, b) => sum + b.totalAmount, 0);
          const rentalCount = customerBookings.length;
          const categories = Array.from(new Set(
            customerBookings.flatMap(b => 
              b.vehicleIds.map(vid => vehicles.find(v => v.id === vid)?.category).filter(Boolean)
            )
          )) as VehicleCategory[];
          
          const segment = getCustomerSegment(totalSpent, rentalCount);

          return (
            <div key={customer.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-100 transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-400 group-hover:from-blue-50 group-hover:to-blue-100 group-hover:text-blue-500 transition-all">
                    <Users size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900">{customer.name}</h3>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${segment.color}`}>
                        {segment.icon}
                        {segment.label}
                      </span>
                    </div>
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
                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-gray-50 rounded-xl p-3 flex flex-col justify-center text-center">
                    <p className="text-xl font-bold text-gray-900">{rentalCount}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Rentals</p>
                  </div>
                  <div className="bg-blue-50/50 rounded-xl p-3 flex flex-col justify-center text-center border border-blue-100/50">
                    <p className="text-xl font-bold text-blue-600">{settings.currency}{totalSpent.toLocaleString()}</p>
                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Total Spent</p>
                  </div>
                </div>
              </div>

              {categories.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-2">
                    <Car size={12} /> Preferred:
                  </div>
                  {categories.map(cat => (
                    <span key={cat} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase">
                      {cat}
                    </span>
                  ))}
                </div>
              )}

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
