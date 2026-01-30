
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  LogOut, 
  LogIn, 
  Car, 
  X,
  Package,
  ChevronRight,
  Palette,
  Users,
  AlertCircle,
  Trash2,
  Edit2,
  Search,
  Check,
  FileText,
  Printer,
  ShieldCheck,
  Info,
  CheckCircle,
  FileSignature
} from 'lucide-react';
import { useRentFlowStore } from '../store';
import { BookingStatus, PaymentStatus, PaymentMethod, VehicleStatus, Booking, DamageEntry } from '../types';

const COMMON_DAMAGES = [
  'Bumper Scratches',
  'Body Dents',
  'Wheel Scuffs',
  'Windshield Crack',
  'Mirror Damage',
  'Interior Stains',
  'Headlight/Taillight',
  'Other'
];

const Bookings: React.FC = () => {
  const { 
    bookings, 
    vehicles, 
    customers, 
    addBooking, 
    updateBooking, 
    updateVehicle, 
    settings, 
    draftBooking, 
    setDraftBooking 
  } = useRentFlowStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [posActionBooking, setPosActionBooking] = useState<{booking: Booking, type: 'checkout' | 'checkin' | 'pay' | 'contract'} | null>(null);
  const [vehicleSearch, setVehicleSearch] = useState('');

  // New/Edit Booking State
  const [formData, setFormData] = useState({
    vehicleIds: [] as string[],
    customerId: '',
    startDate: '',
    endDate: '',
    fromLocation: '',
    toLocation: '',
    depositAmount: 0,
    damages: [] as DamageEntry[],
    notes: ''
  });

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (draftBooking) {
      setModalMode('create');
      setFormData({
        vehicleIds: draftBooking.vehicleId ? [draftBooking.vehicleId] : [],
        startDate: draftBooking.date,
        endDate: draftBooking.date,
        customerId: '',
        fromLocation: 'Office Main',
        toLocation: 'Office Main',
        depositAmount: 200,
        damages: [],
        notes: ''
      });
      setIsModalOpen(true);
      setDraftBooking(null);
    }
  }, [draftBooking, setDraftBooking]);

  const [posData, setPosData] = useState({
    mileage: 0,
    fuel: '8/8',
    amount: 0,
    method: PaymentMethod.CASH,
    note: ''
  });

  const liveQuote = useMemo(() => {
    if (!formData.startDate || !formData.endDate || formData.vehicleIds.length === 0) return { days: 0, subtotal: 0, total: 0, perDay: 0, tax: 0 };
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    if (end < start) return { days: 0, subtotal: 0, total: 0, perDay: 0, tax: 0 };

    const diffTime = end.getTime() - start.getTime();
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const perDaySum = formData.vehicleIds.reduce((sum, vid) => {
      const v = vehicles.find(veh => veh.id === vid);
      return sum + (v?.dailyRate || 0);
    }, 0);

    const subtotal = perDaySum * days;
    const tax = subtotal * (settings.taxRate / 100);
    
    return { days, perDay: perDaySum, subtotal, tax, total: subtotal + tax };
  }, [formData.vehicleIds, formData.startDate, formData.endDate, vehicles, settings]);

  const filteredVehiclesForSelection = vehicles.filter(v => {
    const isAvailableOrSelected = v.status === VehicleStatus.AVAILABLE || formData.vehicleIds.includes(v.id);
    const matchesSearch = v.brand.toLowerCase().includes(vehicleSearch.toLowerCase()) || 
                         v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
                         v.plateNumber.toLowerCase().includes(vehicleSearch.toLowerCase());
    return isAvailableOrSelected && matchesSearch;
  });

  const getStatusStyle = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.ACTIVE: return 'bg-blue-50 text-blue-600 border-blue-100';
      case BookingStatus.RESERVED: return 'bg-amber-50 text-amber-600 border-amber-100';
      case BookingStatus.COMPLETED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case BookingStatus.CANCELLED: return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const toggleVehicleSelection = (id: string) => {
    setFormData(prev => ({
      ...prev,
      vehicleIds: prev.vehicleIds.includes(id) 
        ? prev.vehicleIds.filter(vId => vId !== id)
        : [...prev.vehicleIds, id]
    }));
  };

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.vehicleIds.length === 0 || !formData.customerId || !formData.startDate || !formData.endDate) return;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today && modalMode === 'create') {
      alert("Error: Start date cannot be in the past.");
      return;
    }
    if (end < start) {
      alert("Error: End date cannot be before the start date.");
      return;
    }

    if (modalMode === 'create') {
      addBooking({
        ...formData,
        status: BookingStatus.RESERVED,
        totalAmount: liveQuote.total,
        paymentStatus: PaymentStatus.PENDING,
        damageNotes: '',
      });
    } else if (editingBookingId) {
      updateBooking(editingBookingId, {
        ...formData,
        totalAmount: liveQuote.total,
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ 
      vehicleIds: [], 
      customerId: '', 
      startDate: '', 
      endDate: '', 
      fromLocation: '', 
      toLocation: '', 
      depositAmount: 0, 
      damages: [], 
      notes: '' 
    });
    setEditingBookingId(null);
    setModalMode('create');
    setVehicleSearch('');
  };

  const openEditModal = (booking: Booking) => {
    setModalMode('edit');
    setEditingBookingId(booking.id);
    setFormData({
      vehicleIds: booking.vehicleIds,
      customerId: booking.customerId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      fromLocation: booking.fromLocation,
      toLocation: booking.toLocation,
      depositAmount: booking.depositAmount,
      damages: booking.damages || [],
      notes: booking.notes
    });
    setIsModalOpen(true);
  };

  const handlePOSAction = () => {
    if (!posActionBooking) return;
    const { booking, type } = posActionBooking;
    if (type === 'checkout') {
      updateBooking(booking.id, { status: BookingStatus.ACTIVE, startMileage: posData.mileage, startFuelLevel: posData.fuel });
      booking.vehicleIds.forEach(vid => updateVehicle(vid, { status: VehicleStatus.RENTED }));
    } else if (type === 'checkin') {
      updateBooking(booking.id, { status: BookingStatus.COMPLETED, endMileage: posData.mileage, endFuelLevel: posData.fuel, paymentStatus: PaymentStatus.PAID });
      booking.vehicleIds.forEach(vid => updateVehicle(vid, { status: VehicleStatus.AVAILABLE, currentMileage: posData.mileage }));
    }
    setPosActionBooking(null);
  };

  const signAgreement = (bookingId: string) => {
    updateBooking(bookingId, { contractSignedDate: new Date().toISOString() });
    alert("Agreement Digitally Signed Successfully");
    setPosActionBooking(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings & Operations</h1>
          <p className="text-gray-500">Managing {bookings.length} rental packages.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
        >
          <Plus size={18} />
          Create Booking
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Fleet Detail</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((booking) => {
                const customer = customers.find(c => c.id === booking.customerId);
                const rentedVehicles = vehicles.filter(v => booking.vehicleIds.includes(v.id));
                return (
                  <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{customer?.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {new Date(booking.startDate).toLocaleDateString()} — {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                        {rentedVehicles.map(v => (
                          <div key={v.id} className="text-[10px] font-bold bg-white border border-gray-200 px-2 py-1 rounded-lg flex items-center gap-2 shadow-sm">
                            <div className="w-2.5 h-2.5 rounded-full border border-gray-100" style={{ backgroundColor: v.colorHex }}></div>
                            <span>{v.brand} {v.model}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(booking.status)}`}>
                          {booking.status}
                        </span>
                        {booking.contractSignedDate && (
                          <div className="text-emerald-500" title={`Signed on ${new Date(booking.contractSignedDate).toLocaleDateString()}`}>
                            <CheckCircle size={14} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setPosActionBooking({ booking, type: 'contract' })} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="View Contract">
                          <FileText size={18} />
                        </button>
                        <button onClick={() => openEditModal(booking)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        {booking.status === BookingStatus.RESERVED && (
                          <button onClick={() => setPosActionBooking({ booking, type: 'checkout' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700">
                            Check-out
                          </button>
                        )}
                        {booking.status === BookingStatus.ACTIVE && (
                          <button onClick={() => setPosActionBooking({ booking, type: 'checkin' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700">
                            Check-in
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[90vh] border border-white/20">
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                    <Package className="text-blue-600" size={28} /> 
                    {modalMode === 'create' ? 'Fleet Package Builder' : 'Edit Booking'}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">Combine multiple vehicles and record condition.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="md:hidden p-2 bg-gray-200 rounded-full text-gray-500">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSaveBooking} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-widest">
                      <Users size={16} className="text-blue-500" /> Customer
                    </label>
                    <select required className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-medium"
                      value={formData.customerId}
                      onChange={e => setFormData({...formData, customerId: e.target.value})}>
                      <option value="">Select Existing Customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">Start Date</label>
                      <input 
                        required 
                        type="date" 
                        min={modalMode === 'create' ? todayStr : undefined}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.startDate} 
                        onChange={e => setFormData({...formData, startDate: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">End Date</label>
                      <input 
                        required 
                        type="date" 
                        min={formData.startDate || todayStr}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.endDate} 
                        onChange={e => setFormData({...formData, endDate: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-gray-100 pt-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">Add Fleet Members</label>
                    <div className="relative max-w-xs w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search fleet..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={vehicleSearch}
                        onChange={e => setVehicleSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredVehiclesForSelection.map(v => (
                      <div 
                        key={v.id} 
                        onClick={() => toggleVehicleSelection(v.id)}
                        className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                          formData.vehicleIds.includes(v.id) ? 'bg-blue-50' : 'hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${formData.vehicleIds.includes(v.id) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            <Car size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{v.brand} {v.model}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase px-1.5 py-0.5 bg-gray-200/50 rounded">{v.plateNumber}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-blue-600">{settings.currency}{v.dailyRate}/day</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            formData.vehicleIds.includes(v.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                          }`}>
                            {formData.vehicleIds.includes(v.id) && <Check size={12} className="text-white" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="hidden md:flex w-[360px] bg-slate-900 text-white flex-col p-10 shrink-0 relative">
               <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
                <X size={28} />
               </button>

               <div className="mb-10">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Checkout Details</p>
                 <h4 className="text-3xl font-black">Quote</h4>
               </div>

               <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
                 {formData.vehicleIds.length > 0 ? (
                   <div className="space-y-4">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fleet Items</p>
                     <div className="space-y-3">
                        {formData.vehicleIds.map(vid => {
                            const v = vehicles.find(veh => veh.id === vid);
                            return (
                              <div key={vid} className="flex justify-between items-center text-sm bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <div className="w-2.5 h-2.5 rounded-full border border-slate-600 shrink-0" style={{ backgroundColor: v?.colorHex }}></div>
                                  <span className="font-semibold text-slate-200 truncate">{v?.brand} {v?.model}</span>
                                </div>
                                <span className="font-black text-blue-400 shrink-0">{settings.currency}{v?.dailyRate}</span>
                              </div>
                            );
                        })}
                     </div>
                     <div className="h-px bg-slate-800 my-4" />
                     {liveQuote.days > 0 ? (
                       <>
                         <div className="flex justify-between text-sm text-slate-400"><span>Duration</span><span className="text-white font-bold">{liveQuote.days} Days</span></div>
                         <div className="flex justify-between text-sm text-slate-400"><span>Tax ({settings.taxRate}%)</span><span className="text-white font-bold">{settings.currency}{liveQuote.tax.toFixed(2)}</span></div>
                       </>
                     ) : (
                        <p className="text-xs text-red-400 font-bold bg-red-900/20 p-2 rounded-lg border border-red-800/50">Invalid date range selected.</p>
                     )}
                   </div>
                 ) : (
                    <div className="text-slate-600 py-16 text-center">
                      <Car size={48} className="mx-auto opacity-20 mb-4" />
                      <p className="text-sm font-semibold">Build a package to calculate price</p>
                    </div>
                 )}
               </div>

               <div className="mt-10 pt-10 border-t border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Estimated Total</p>
                  <p className="text-4xl font-black text-blue-500 mb-8">{settings.currency}{liveQuote.total.toLocaleString()}</p>
                  <button onClick={handleSaveBooking} disabled={formData.vehicleIds.length === 0 || !formData.customerId || liveQuote.days === 0}
                    className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40 disabled:opacity-30">
                    {modalMode === 'create' ? 'Save Reservation' : 'Update Reservation'} <ChevronRight size={20} />
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {posActionBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[90vh]">
            {posActionBooking.type === 'contract' ? (
              <div className="flex flex-col flex-1 overflow-hidden printable-agreement">
                {/* Contract Controls (Hidden in Print) */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 no-print">
                  <div className="flex items-center gap-3">
                    <FileSignature size={24} className="text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Digital Rental Agreement</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-bold text-sm shadow-sm transition-all">
                      <Printer size={18} /> Print Document
                    </button>
                    <button onClick={() => setPosActionBooking(null)} className="p-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 transition-all">
                      <X size={20} />
                    </button>
                  </div>
                </div>
                
                {/* Scrollable Document Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-gray-100/50">
                  <div className="max-w-[800px] mx-auto bg-white shadow-2xl border p-16 space-y-12 text-gray-800 printable-agreement rounded-lg">
                    {/* Agreement Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-4">
                           <div className="bg-blue-600 p-2 rounded-lg text-white">
                             <Car size={32} />
                           </div>
                           <h1 className="text-4xl font-black tracking-tighter text-gray-900">{settings.companyName.toUpperCase()}</h1>
                        </div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em]">{settings.companyAddress}</p>
                        <p className="text-sm font-medium text-gray-400">Email: {settings.companyEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Contract Number</p>
                        <p className="text-2xl font-black text-gray-900">REF-{posActionBooking.booking.id.toUpperCase()}</p>
                        <p className="text-xs font-bold text-blue-600 mt-2 uppercase tracking-tighter">Generated on {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    <h2 className="text-3xl font-black text-center uppercase tracking-[0.3em] py-4">Vehicle Rental Agreement</h2>

                    <div className="grid grid-cols-2 gap-16">
                      <section className="space-y-4">
                        <h4 className="font-black text-blue-600 uppercase text-[10px] tracking-widest border-b-2 border-blue-50 pb-2">Part 1: The Provider (Lessor)</h4>
                        <div className="text-sm leading-relaxed">
                          <p className="font-black text-gray-900">{settings.companyName}</p>
                          <p className="text-gray-600 italic">Legal Entity Registered and Authorized for Fleet Management</p>
                          <p className="mt-4 text-gray-500">{settings.companyAddress}</p>
                        </div>
                      </section>
                      <section className="space-y-4">
                        <h4 className="font-black text-blue-600 uppercase text-[10px] tracking-widest border-b-2 border-blue-50 pb-2">Part 2: The Renter (Lessee)</h4>
                        <div className="text-sm leading-relaxed">
                          <p className="font-black text-gray-900">{customers.find(c => c.id === posActionBooking.booking.customerId)?.name}</p>
                          <p className="text-gray-500">License No: <span className="font-mono font-bold text-gray-900">{customers.find(c => c.id === posActionBooking.booking.customerId)?.licenseNumber}</span></p>
                          <p className="text-gray-500">Contact: {customers.find(c => c.id === posActionBooking.booking.customerId)?.phone}</p>
                          <p className="text-gray-500">Email: {customers.find(c => c.id === posActionBooking.booking.customerId)?.email}</p>
                        </div>
                      </section>
                    </div>

                    <section className="space-y-4">
                      <h4 className="font-black text-blue-600 uppercase text-[10px] tracking-widest border-b-2 border-blue-50 pb-2">Part 3: Fleet Assets Dispatched</h4>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                            <th className="p-4 text-left border">Vehicle Description</th>
                            <th className="p-4 text-center border">Plate No.</th>
                            <th className="p-4 text-center border">Start Mileage</th>
                            <th className="p-4 text-right border">Daily Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicles.filter(v => posActionBooking.booking.vehicleIds.includes(v.id)).map(v => (
                            <tr key={v.id} className="border-b">
                              <td className="p-4 font-bold text-gray-900 border">
                                {v.brand} {v.model} ({v.color})
                              </td>
                              <td className="p-4 text-center font-mono font-bold border">{v.plateNumber}</td>
                              <td className="p-4 text-center border">{v.currentMileage.toLocaleString()} KM</td>
                              <td className="p-4 text-right font-black border">{settings.currency}{v.dailyRate}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                           <tr className="bg-gray-50 font-black">
                             <td colSpan={3} className="p-4 text-right border uppercase tracking-widest text-[10px]">Rental Duration: {Math.ceil((new Date(posActionBooking.booking.endDate).getTime() - new Date(posActionBooking.booking.startDate).getTime()) / (1000 * 60 * 60 * 24))} Days</td>
                             <td className="p-4 text-right border text-blue-600 text-lg">{settings.currency}{posActionBooking.booking.totalAmount.toLocaleString()}</td>
                           </tr>
                        </tfoot>
                      </table>
                    </section>

                    <section className="space-y-4">
                      <h4 className="font-black text-blue-600 uppercase text-[10px] tracking-widest border-b-2 border-blue-50 pb-2">Part 4: Specific Rental Terms</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] text-gray-500 leading-relaxed uppercase font-bold tracking-tight">
                        <div className="space-y-3">
                           <p>• Renter acknowledges vehicle condition log recorded at dispatch.</p>
                           <p>• Late returns are subject to a fee of {settings.currency}{settings.lateFeePerHour}/hour per vehicle.</p>
                           <p>• Vehicles must be returned with the same fuel level as recorded at dispatch.</p>
                        </div>
                        <div className="space-y-3">
                           <p>• Lessor is not responsible for personal property left in the vehicle.</p>
                           <p>• Renter assumes all liability for traffic violations during the rental term.</p>
                           <p>• Insurance coverage is subject to valid license and adherence to traffic laws.</p>
                        </div>
                      </div>
                    </section>

                    {/* Signature Area */}
                    <div className="pt-24 grid grid-cols-2 gap-24">
                       <div className="space-y-6">
                         <div className="border-b-2 border-gray-300 h-16 relative">
                            <span className="absolute bottom-[-24px] left-0 text-[10px] font-black uppercase text-gray-400">Signature of Renter (Lessee)</span>
                            {posActionBooking.booking.contractSignedDate && (
                              <div className="absolute inset-0 flex items-center justify-center font-bold text-blue-600 opacity-50 transform -rotate-12 uppercase text-lg border-2 border-blue-600 px-4 py-1 rounded-lg">
                                Digitally Signed
                              </div>
                            )}
                         </div>
                         <p className="text-[10px] font-bold text-gray-400">DATE: {posActionBooking.booking.contractSignedDate ? new Date(posActionBooking.booking.contractSignedDate).toLocaleDateString() : '_________________'}</p>
                       </div>
                       <div className="space-y-6">
                         <div className="border-b-2 border-gray-300 h-16 relative">
                            <span className="absolute bottom-[-24px] left-0 text-[10px] font-black uppercase text-gray-400">Signature of Authorized Agent (Lessor)</span>
                            <div className="absolute inset-0 flex items-center justify-center font-black text-slate-900 opacity-30 transform -rotate-6 uppercase text-xl">
                               {settings.companyName}
                            </div>
                         </div>
                         <p className="text-[10px] font-bold text-gray-400">DATE: {new Date().toLocaleDateString()}</p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Footer Signing Action (Hidden in Print) */}
                {!posActionBooking.booking.contractSignedDate && (
                  <div className="p-8 bg-white border-t flex justify-center no-print">
                    <button 
                      onClick={() => signAgreement(posActionBooking.booking.id)}
                      className="flex items-center gap-3 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all scale-110"
                    >
                      <FileSignature size={24} />
                      Confirm & Digitally Sign Agreement
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-10 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-gray-900 capitalize">Operation: {posActionBooking.type.replace('check', 'Check-')}</h3>
                  <button onClick={() => setPosActionBooking(null)}><X size={24} /></button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Odometer Reading (KM)</label>
                    <input type="number" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="0"
                      onChange={e => setPosData({...posData, mileage: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Fuel Level</label>
                    <select className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none"
                      onChange={e => setPosData({...posData, fuel: e.target.value})}>
                      <option>8/8 Full</option>
                      <option>7/8</option>
                      <option>6/8</option>
                      <option>4/8 Half</option>
                      <option>2/8</option>
                      <option>0/8 Empty</option>
                    </select>
                  </div>
                  <button onClick={handlePOSAction} className={`w-full py-5 text-white font-black rounded-2xl shadow-xl transition-all ${posActionBooking.type === 'checkin' ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'}`}>
                    Confirm Operational {posActionBooking.type.replace('check', 'Check-')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
