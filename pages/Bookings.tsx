
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  LogOut, 
  LogIn, 
  MapPin, 
  DollarSign,
  CheckCircle2,
  Car,
  Navigation,
  X,
  Package,
  Calendar,
  ChevronRight,
  Info,
  Hash,
  Palette,
  Users,
  Fuel,
  AlertCircle,
  Camera,
  Trash2,
  Edit2,
  Search,
  Check
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
    addTransaction, 
    settings, 
    draftBooking, 
    setDraftBooking 
  } = useRentFlowStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [posActionBooking, setPosActionBooking] = useState<{booking: Booking, type: 'checkout' | 'checkin' | 'pay'} | null>(null);
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

  // Handle cross-page navigation
  useEffect(() => {
    if (draftBooking) {
      setModalMode('create');
      setFormData({
        vehicleIds: draftBooking.vehicleId ? [draftBooking.vehicleId] : [],
        startDate: draftBooking.date,
        endDate: draftBooking.date,
        customerId: '',
        fromLocation: '',
        toLocation: '',
        depositAmount: 0,
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
    // Show available vehicles OR vehicles already in the current booking
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

  const handleAddDamage = (type: string) => {
    if (formData.damages.some(d => d.type === type)) return;
    setFormData(prev => ({ ...prev, damages: [...prev.damages, { type, notes: '', photos: [] }] }));
  };

  const handleRemoveDamage = (type: string) => {
    setFormData(prev => ({ ...prev, damages: prev.damages.filter(d => d.type !== type) }));
  };

  const handleDamageNoteChange = (type: string, notes: string) => {
    setFormData(prev => ({ ...prev, damages: prev.damages.map(d => d.type === type ? { ...d, notes } : d) }));
  };

  const handlePhotoUpload = async (type: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const newPhotos: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const photo = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      newPhotos.push(photo);
    }
    setFormData(prev => ({ ...prev, damages: prev.damages.map(d => d.type === type ? { ...d, photos: [...d.photos, ...newPhotos] } : d) }));
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
    } else if (type === 'pay') {
      addTransaction({ bookingId: booking.id, amount: posData.amount, method: posData.method, type: 'RENTAL_FEE', note: posData.note || 'Payment' });
    }
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
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer & Route</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Rental Package</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Operations</th>
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
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color.toLowerCase() }}></div>
                            <span>{v.brand} {v.model} ({v.plateNumber})</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] font-black text-blue-600 mt-2">
                         Total: {settings.currency}{booking.totalAmount.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(booking)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        {booking.status === BookingStatus.RESERVED && (
                          <button onClick={() => setPosActionBooking({ booking, type: 'checkout' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700">
                            <LogOut size={14} /> Check-out
                          </button>
                        )}
                        {booking.status === BookingStatus.ACTIVE && (
                          <button onClick={() => setPosActionBooking({ booking, type: 'checkin' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700">
                            <LogIn size={14} /> Check-in
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
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Users size={16} className="text-blue-500" /> Customer
                    </label>
                    <select required className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                      value={formData.customerId}
                      onChange={e => setFormData({...formData, customerId: e.target.value})}>
                      <option value="">Select Existing Customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-700">Start Date</label>
                      <input required type="date" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold"
                        value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-700">End Date</label>
                      <input required type="date" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold"
                        value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Scalable Vehicle Selection */}
                <div className="space-y-4 border-t border-gray-100 pt-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Select Vehicles for Fleet Package</label>
                    <div className="relative max-w-xs w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search fleet..." 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={vehicleSearch}
                        onChange={e => setVehicleSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
                    {filteredVehiclesForSelection.length > 0 ? (
                      <div className="divide-y divide-gray-200">
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
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color.toLowerCase() }}></div>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">{v.color}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-black text-blue-600">{settings.currency}{v.dailyRate}/day</span>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                formData.vehicleIds.includes(v.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                              }`}>
                                {formData.vehicleIds.includes(v.id) && <Check size={14} className="text-white" />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-sm">No vehicles matching your search or status.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-6 border-t border-gray-100 pt-8">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="text-red-500" size={20} /> Pre-Rental Damage Log
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_DAMAGES.map(type => (
                      <button key={type} type="button" onClick={() => handleAddDamage(type)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${
                          formData.damages.some(d => d.type === type) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
                        }`}>{type}</button>
                    ))}
                  </div>
                  {formData.damages.map((damage) => (
                    <div key={damage.type} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-bold text-gray-900">{damage.type}</h5>
                        <button type="button" onClick={() => handleRemoveDamage(damage.type)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                      <textarea className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm min-h-[80px]" placeholder="Damage details..."
                        value={damage.notes} onChange={e => handleDamageNoteChange(damage.type, e.target.value)} />
                    </div>
                  ))}
                </div>
              </form>
            </div>

            <div className="hidden md:flex w-[360px] bg-slate-900 text-white flex-col p-10 shrink-0 relative">
               <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
                <X size={28} />
               </button>

               <div className="mb-10">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Rental Summary</p>
                 <h4 className="text-3xl font-black">Quote</h4>
               </div>

               <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
                 {formData.vehicleIds.length > 0 ? (
                   <div className="space-y-4">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selected Fleet</p>
                     <div className="space-y-3">
                        {formData.vehicleIds.map(vid => {
                            const v = vehicles.find(veh => veh.id === vid);
                            return (
                              <div key={vid} className="flex justify-between items-center text-sm bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <span className="font-semibold text-slate-200 truncate pr-2">{v?.brand} {v?.model}</span>
                                <span className="font-black text-blue-400 shrink-0">{settings.currency}{v?.dailyRate}</span>
                              </div>
                            );
                        })}
                     </div>
                     <div className="h-px bg-slate-800 my-4" />
                     <div className="flex justify-between text-sm text-slate-400"><span>Duration</span><span className="text-white font-bold">{liveQuote.days} Days</span></div>
                     <div className="flex justify-between text-sm text-slate-400"><span>Tax ({settings.taxRate}%)</span><span className="text-white font-bold">{settings.currency}{liveQuote.tax.toFixed(2)}</span></div>
                   </div>
                 ) : (
                    <div className="text-slate-600 py-16 text-center">
                      <Package size={48} className="mx-auto opacity-20 mb-4" />
                      <p className="text-sm font-semibold">Select vehicles to calculate cost</p>
                    </div>
                 )}
               </div>

               <div className="mt-10 pt-10 border-t border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Total Estimated Price</p>
                  <p className="text-4xl font-black text-blue-500 mb-8">{settings.currency}{liveQuote.total.toLocaleString()}</p>
                  <button onClick={handleSaveBooking} disabled={formData.vehicleIds.length === 0 || !formData.customerId}
                    className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40 disabled:opacity-30">
                    {modalMode === 'create' ? 'Confirm Reservation' : 'Update Booking'} <ChevronRight size={20} />
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Basic Check-in/out Modal */}
      {posActionBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold capitalize">{posActionBooking.type.replace('check', 'Check-')}</h3>
              <button onClick={() => setPosActionBooking(null)}><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Enter Odometer (KM)</label>
              <input type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl" placeholder="Current km..."
                onChange={e => setPosData({...posData, mileage: Number(e.target.value)})} />
              <button onClick={handlePOSAction} className={`w-full py-4 text-white font-bold rounded-2xl ${posActionBooking.type === 'checkin' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                Complete {posActionBooking.type.replace('check', 'Check-')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
