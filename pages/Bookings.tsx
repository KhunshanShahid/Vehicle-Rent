
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Edit2
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

  // Handle cross-page navigation from calendar or dashboard quick-add
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
    
    return {
      days,
      perDay: perDaySum,
      subtotal,
      tax,
      total: subtotal + tax
    };
  }, [formData.vehicleIds, formData.startDate, formData.endDate, vehicles, settings]);

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
    setFormData(prev => ({
      ...prev,
      damages: [...prev.damages, { type, notes: '', photos: [] }]
    }));
  };

  const handleRemoveDamage = (type: string) => {
    setFormData(prev => ({
      ...prev,
      damages: prev.damages.filter(d => d.type !== type)
    }));
  };

  const handleDamageNoteChange = (type: string, notes: string) => {
    setFormData(prev => ({
      ...prev,
      damages: prev.damages.map(d => d.type === type ? { ...d, notes } : d)
    }));
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

    setFormData(prev => ({
      ...prev,
      damages: prev.damages.map(d => d.type === type ? { ...d, photos: [...d.photos, ...newPhotos] } : d)
    }));
  };

  const handlePOSAction = () => {
    if (!posActionBooking) return;
    const { booking, type } = posActionBooking;

    if (type === 'checkout') {
      updateBooking(booking.id, { 
        status: BookingStatus.ACTIVE, 
        startMileage: posData.mileage, 
        startFuelLevel: posData.fuel 
      });
      booking.vehicleIds.forEach(vid => updateVehicle(vid, { status: VehicleStatus.RENTED }));
    } else if (type === 'checkin') {
      updateBooking(booking.id, { 
        status: BookingStatus.COMPLETED, 
        endMileage: posData.mileage, 
        endFuelLevel: posData.fuel,
        paymentStatus: PaymentStatus.PAID
      });
      booking.vehicleIds.forEach(vid => updateVehicle(vid, { status: VehicleStatus.AVAILABLE, currentMileage: posData.mileage }));
    } else if (type === 'pay') {
      addTransaction({
        bookingId: booking.id,
        amount: posData.amount,
        method: posData.method,
        type: 'RENTAL_FEE',
        note: posData.note || 'Payment for rental'
      });
    }

    setPosActionBooking(null);
    setPosData({ mileage: 0, fuel: '8/8', amount: 0, method: PaymentMethod.CASH, note: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings & Operations</h1>
          <p className="text-gray-500">Manage multiple vehicles as high-value rental packages.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
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
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-bold">{booking.fromLocation || 'N/A'}</span>
                         <Navigation size={10} className="text-blue-400" />
                         <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-bold">{booking.toLocation || 'N/A'}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">
                        {new Date(booking.startDate).toLocaleDateString()} — {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                        {rentedVehicles.map(v => (
                          <div key={v.id} className="text-[10px] font-bold bg-white border border-gray-200 px-2 py-1 rounded-lg flex items-center gap-2 shadow-sm">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color.toLowerCase() }}></div>
                            <span>{v.brand} {v.model}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-[11px] font-black text-blue-600 flex items-center gap-1">
                          <Hash size={12} /> {rentedVehicles.length} Vehicles · Total: {settings.currency}{booking.totalAmount.toLocaleString()}
                        </p>
                        {booking.damages && booking.damages.length > 0 && (
                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                            <AlertCircle size={10} /> {booking.damages.length} Dam.
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(booking)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        {booking.status === BookingStatus.RESERVED && (
                          <button 
                            onClick={() => setPosActionBooking({ booking, type: 'checkout' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm"
                          >
                            <LogOut size={14} /> Check-out
                          </button>
                        )}
                        {booking.status === BookingStatus.ACTIVE && (
                          <button 
                            onClick={() => setPosActionBooking({ booking, type: 'checkin' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 shadow-sm"
                          >
                            <LogIn size={14} /> Check-in
                          </button>
                        )}
                        <button 
                          onClick={() => setPosActionBooking({ booking, type: 'pay' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 shadow-sm"
                        >
                          <DollarSign size={14} /> Pay
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                    No active booking packages found. Start by selecting your first fleet combination.
                  </td>
                </tr>
              )}
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
                    {modalMode === 'create' ? 'Fleet Package Builder' : 'Edit Booking Contract'}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">Combine multiple vehicles and record asset condition.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="md:hidden p-2 bg-gray-200 rounded-full text-gray-500">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSaveBooking} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Users size={16} className="text-blue-500" /> Customer Information
                    </label>
                    <select 
                      required 
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      value={formData.customerId}
                      onChange={e => setFormData({...formData, customerId: e.target.value})}
                    >
                      <option value="">Select Existing Customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Calendar size={16} className="text-blue-500" /> Start Date
                      </label>
                      <input required type="date" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        value={formData.startDate}
                        onChange={e => setFormData({...formData, startDate: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Calendar size={16} className="text-blue-500" /> End Date
                      </label>
                      <input required type="date" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        value={formData.endDate}
                        onChange={e => setFormData({...formData, endDate: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Locations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <MapPin size={16} className="text-blue-500" /> Pick-up Location
                    </label>
                    <input required type="text" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" 
                      placeholder="Airport, Hotel, Office..."
                      value={formData.fromLocation}
                      onChange={e => setFormData({...formData, fromLocation: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Navigation size={16} className="text-blue-500" /> Drop-off Location
                    </label>
                    <input required type="text" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" 
                      placeholder="Same as pick-up or custom"
                      value={formData.toLocation}
                      onChange={e => setFormData({...formData, toLocation: e.target.value})} />
                  </div>
                </div>

                {/* Fleet Selection */}
                <div className="space-y-4 border-t border-gray-100 pt-8">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700 block uppercase tracking-wider">Select Vehicles for Package</label>
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {formData.vehicleIds.length} Fleet Items
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.filter(v => v.status === VehicleStatus.AVAILABLE || formData.vehicleIds.includes(v.id)).map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleVehicleSelection(v.id)}
                        className={`flex items-center gap-4 p-4 border-2 rounded-2xl transition-all text-left relative group ${
                          formData.vehicleIds.includes(v.id) 
                            ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-50' 
                            : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                      >
                        <div className={`p-3 rounded-xl transition-colors ${formData.vehicleIds.includes(v.id) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <Car size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{v.brand} {v.model}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: v.color.toLowerCase() }}></div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase">{v.color}</span>
                             </div>
                             <span className="text-[10px] text-blue-600 font-black">{settings.currency}{v.dailyRate}/day</span>
                          </div>
                        </div>
                        {formData.vehicleIds.includes(v.id) && (
                          <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1 shadow-md">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Damage Checklist */}
                <div className="space-y-6 border-t border-gray-100 pt-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <AlertCircle className="text-red-500" size={20} />
                        Pre-Rental Damage Checklist
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">Record existing damage to avoid disputes later.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_DAMAGES.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleAddDamage(type)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                            formData.damages.some(d => d.type === type)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {formData.damages.map((damage) => (
                      <div key={damage.type} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 animate-in slide-in-from-left-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                              <AlertCircle size={18} />
                            </div>
                            <h5 className="font-bold text-gray-900">{damage.type}</h5>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleRemoveDamage(damage.type)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Observation Notes</label>
                            <textarea
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[80px] resize-none"
                              placeholder="Describe the location, severity, and details..."
                              value={damage.notes}
                              onChange={e => handleDamageNoteChange(damage.type, e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                              Photo Evidence 
                              <span className="text-blue-600 font-bold">{damage.photos.length} Captured</span>
                            </label>
                            <div className="flex flex-wrap gap-3 min-h-[80px]">
                              {damage.photos.map((photo, i) => (
                                <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                                  <img src={photo} alt="" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedDamages = formData.damages.map(d => 
                                        d.type === damage.type ? { ...d, photos: d.photos.filter((_, idx) => idx !== i) } : d
                                      );
                                      setFormData({ ...formData, damages: updatedDamages });
                                    }}
                                    className="absolute inset-0 bg-red-600/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-all bg-white group">
                                <Camera size={20} className="mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[8px] font-bold uppercase">Capture</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  capture="environment" 
                                  className="hidden" 
                                  multiple
                                  onChange={(e) => handlePhotoUpload(damage.type, e)}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {formData.damages.length === 0 && (
                      <div className="p-12 border-2 border-dashed border-gray-100 rounded-3xl text-center">
                        <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-3">
                          <CheckCircle2 size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-400">No damage recorded. Click a tag above to start checking.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:hidden pt-4">
                  <button 
                    type="submit" 
                    disabled={formData.vehicleIds.length === 0}
                    className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 disabled:opacity-50"
                  >
                    Confirm Package ({settings.currency}{liveQuote.total})
                  </button>
                </div>
              </form>
            </div>

            {/* Sidebar Summary Panel */}
            <div className="hidden md:flex w-[360px] bg-slate-900 text-white flex-col p-10 shrink-0 relative">
               <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
                <X size={28} />
               </button>

               <div className="mb-10">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Rental Config</p>
                 <h4 className="text-3xl font-black">Package Quote</h4>
               </div>

               <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar">
                 {formData.vehicleIds.length > 0 ? (
                    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                          Selected Fleet <span>{formData.vehicleIds.length}</span>
                        </p>
                        <div className="space-y-2">
                          {formData.vehicleIds.map(vid => {
                            const v = vehicles.find(veh => veh.id === vid);
                            return (
                              <div key={vid} className="flex justify-between items-center text-sm bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <span className="truncate flex items-center gap-3">
                                  <div className="w-3 h-3 rounded-full border border-slate-600" style={{ backgroundColor: v?.color.toLowerCase() }}></div>
                                  <span className="font-semibold text-slate-200">{v?.brand} {v?.model}</span>
                                </span>
                                <span className="font-black text-blue-400">{settings.currency}{v?.dailyRate}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {formData.damages.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Damage Log</p>
                          <div className="space-y-2">
                            {formData.damages.map(d => (
                              <div key={d.type} className="flex items-center gap-2 text-xs text-red-200 bg-red-900/20 p-2 rounded-lg border border-red-900/30">
                                <AlertCircle size={12} />
                                {d.type}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="h-px bg-slate-800"></div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2 text-slate-400"><Calendar size={16}/> Package Duration</span>
                          <span className="font-black">{liveQuote.days} Days</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2 text-slate-400"><Palette size={16}/> Daily Subtotal</span>
                          <span className="font-black">{settings.currency}{liveQuote.perDay.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 flex items-center gap-2"><DollarSign size={16}/> Tax ({settings.taxRate}%)</span>
                          <span className="font-black text-slate-300">{settings.currency}{liveQuote.tax.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                 ) : (
                    <div className="text-slate-600 py-16 text-center space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-3xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                        <Package size={32} />
                      </div>
                      <p className="text-sm font-semibold max-w-[200px] mx-auto">Select vehicles to calculate total package cost</p>
                    </div>
                 )}
               </div>

               <div className="mt-10 pt-10 border-t border-slate-800">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Estimated Price</p>
                      <p className="text-4xl font-black text-blue-500">{settings.currency}{liveQuote.total.toLocaleString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveBooking}
                    disabled={formData.vehicleIds.length === 0 || !formData.customerId}
                    className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all shadow-2xl shadow-blue-900/40 disabled:opacity-30 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
                  >
                    {modalMode === 'create' ? 'Confirm Reservation' : 'Update Contract'} <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* POS Action Modal */}
      {posActionBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold capitalize">{posActionBooking.type.replace('check', 'Check-')} Process</h3>
              <button onClick={() => setPosActionBooking(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              {posActionBooking.type !== 'pay' ? (
                <>
                  <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 border border-blue-100 mb-2">
                    <Info className="text-blue-600 shrink-0" size={18} />
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                      Ensure all vehicles in the package are physically inspected for {posActionBooking.type === 'checkout' ? 'pre-rental' : 'return'} damages.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <MapPin size={16} /> Collective Mileage Reading (km)
                    </label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                      placeholder="Total km reading..."
                      onChange={e => setPosData({...posData, mileage: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Fuel size={16} /> Fuel Status
                    </label>
                    <select 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                      onChange={e => setPosData({...posData, fuel: e.target.value})}
                    >
                      <option>8/8 (Full)</option>
                      <option>7/8</option>
                      <option>6/8</option>
                      <option>4/8 (Half)</option>
                      <option>2/8</option>
                      <option>1/8 (Empty)</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Payment Amount ({settings.currency})</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600 text-lg"
                      placeholder="0.00"
                      onChange={e => setPosData({...posData, amount: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Payment Method</label>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.values(PaymentMethod).map(m => (
                        <button
                          key={m}
                          onClick={() => setPosData({...posData, method: m})}
                          className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${
                            posData.method === m ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <button 
                onClick={handlePOSAction}
                className={`w-full py-4 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 ${
                  posActionBooking.type === 'checkin' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                <CheckCircle2 size={20} />
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
