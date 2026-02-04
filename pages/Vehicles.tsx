
import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Car, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  X,
  Edit3,
  Palette,
  Download,
  Upload,
  Calendar,
  Wrench,
  Clock,
  History,
  Tag,
  DollarSign,
  FileText,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useRentFlowStore } from '../store';
import { VehicleStatus, Vehicle, VehicleCategory, MaintenanceRecord } from '../types';

const SERVICE_TYPES = [
  'Oil Change',
  'Brake Inspection',
  'Tire Rotation',
  'Full Service',
  'Battery Check',
  'AC Service',
  'Emission Test',
  'Other'
];

const VEHICLE_CATEGORIES = Object.values(VehicleCategory);

const Vehicles: React.FC = () => {
  const { vehicles, addVehicle, bulkAddVehicles, updateVehicle, settings } = useRentFlowStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<VehicleStatus | 'ALL' | 'DUE_SOON' | 'OVERDUE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  const now = new Date();

  const maintenanceStats = useMemo(() => {
    const overdue = vehicles.filter(v => v.nextServiceDate && new Date(v.nextServiceDate) < now).length;
    const approaching = vehicles.filter(v => {
      if (!v.nextServiceDate) return false;
      const next = new Date(v.nextServiceDate);
      const diff = next.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 7;
    }).length;
    
    return { overdue, approaching, total: vehicles.length };
  }, [vehicles]);

  const [formState, setFormState] = useState<Partial<Vehicle>>({
    brand: '',
    model: '',
    plateNumber: '',
    category: VehicleCategory.SEDAN,
    status: VehicleStatus.AVAILABLE,
    dailyRate: 0,
    maintenanceNotes: '',
    image: '',
    color: 'Silver',
    colorHex: '#C0C0C0',
    lastServiceDate: '',
    nextServiceDate: '',
    nextServiceType: 'Oil Change',
    currentMileage: 0,
    maintenanceHistory: []
  });

  const [logState, setLogState] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Oil Change',
    notes: '',
    cost: 0,
    mileage: 0
  });

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filter === 'ALL') matchesFilter = true;
    else if (filter === 'OVERDUE') matchesFilter = !!(v.nextServiceDate && new Date(v.nextServiceDate) < now);
    else if (filter === 'DUE_SOON') {
      if (!v.nextServiceDate) matchesFilter = false;
      else {
        const diff = new Date(v.nextServiceDate).getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        matchesFilter = days >= 0 && days <= 7;
      }
    }
    else matchesFilter = v.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const openAddModal = () => {
    setModalMode('add');
    setActiveTab('details');
    setEditingVehicleId(null);
    setFormState({
      brand: '',
      model: '',
      plateNumber: '',
      category: VehicleCategory.SEDAN,
      status: VehicleStatus.AVAILABLE,
      dailyRate: 0,
      maintenanceNotes: '',
      image: 'https://picsum.photos/seed/' + Math.random() + '/400/300',
      color: 'Silver',
      colorHex: '#C0C0C0',
      lastServiceDate: new Date().toISOString().split('T')[0],
      nextServiceDate: '',
      nextServiceType: 'Oil Change',
      currentMileage: 0,
      maintenanceHistory: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setModalMode('edit');
    setActiveTab('details');
    setEditingVehicleId(vehicle.id);
    setFormState({ ...vehicle });
    setLogState(prev => ({ ...prev, type: vehicle.nextServiceType || 'Oil Change', mileage: vehicle.currentMileage }));
    setIsModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.brand && formState.model && formState.plateNumber) {
      if (modalMode === 'add') {
        addVehicle(formState as Omit<Vehicle, 'id' | 'maintenanceHistory'>);
      } else if (editingVehicleId) {
        updateVehicle(editingVehicleId, formState);
      }
      setIsModalOpen(false);
    }
  };

  const handleLogMaintenance = () => {
    if (!editingVehicleId) return;
    const vehicle = vehicles.find(v => v.id === editingVehicleId);
    if (!vehicle) return;

    const newRecord: MaintenanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: logState.date,
      type: logState.type,
      notes: logState.notes,
      cost: logState.cost,
      mileageAtService: logState.mileage
    };

    const newHistory = [newRecord, ...(vehicle.maintenanceHistory || [])];
    
    updateVehicle(editingVehicleId, {
      maintenanceHistory: newHistory,
      lastServiceDate: logState.date,
      currentMileage: logState.mileage,
      status: VehicleStatus.AVAILABLE 
    });

    setFormState(prev => ({ ...prev, maintenanceHistory: newHistory, status: VehicleStatus.AVAILABLE, lastServiceDate: logState.date, currentMileage: logState.mileage }));
    setLogState({
      date: new Date().toISOString().split('T')[0],
      type: 'Oil Change',
      notes: '',
      cost: 0,
      mileage: logState.mileage
    });
    alert('Maintenance record added and vehicle status set to Available.');
  };

  const getMaintenanceHealth = (v: Vehicle) => {
    if (!v.nextServiceDate) return { label: 'Unknown', color: 'gray', overdue: false };
    const next = new Date(v.nextServiceDate);
    const diff = next.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { label: `${Math.abs(days)}d Overdue`, color: 'red', overdue: true };
    if (days <= 7) return { label: `Due in ${days}d`, color: 'amber', overdue: false };
    return { label: `Service in ${days}d`, color: 'emerald', overdue: false };
  };

  const statusColors = {
    [VehicleStatus.AVAILABLE]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    [VehicleStatus.RENTED]: 'bg-blue-50 text-blue-600 border-blue-100',
    [VehicleStatus.MAINTENANCE]: 'bg-amber-50 text-amber-600 border-amber-100',
    [VehicleStatus.UNAVAILABLE]: 'bg-gray-50 text-gray-600 border-gray-100',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Fleet</h1>
          <p className="text-gray-500">Manage your rental inventory and maintenance schedules.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={18} />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Maintenance Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setFilter('OVERDUE')}
          className={`p-6 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden ${filter === 'OVERDUE' ? 'bg-red-600 border-red-600 text-white shadow-xl shadow-red-200' : 'bg-white border-red-100 hover:border-red-300'}`}
        >
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${filter === 'OVERDUE' ? 'text-red-100' : 'text-red-500'}`}>Overdue Service</p>
              <h4 className="text-3xl font-black mt-1">{maintenanceStats.overdue}</h4>
            </div>
            <div className={`p-3 rounded-2xl ${filter === 'OVERDUE' ? 'bg-red-500/30' : 'bg-red-50 text-red-600'}`}>
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 relative z-10">
             <span className={`text-[10px] font-bold ${filter === 'OVERDUE' ? 'text-red-100' : 'text-gray-400'}`}>Requires immediate attention</span>
             <ChevronRight size={14} className={filter === 'OVERDUE' ? 'text-red-200' : 'text-gray-300'} />
          </div>
          {maintenanceStats.overdue > 0 && filter !== 'OVERDUE' && (
             <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/5 translate-x-4 -translate-y-4 rounded-full"></div>
          )}
        </div>

        <div 
          onClick={() => setFilter('DUE_SOON')}
          className={`p-6 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden ${filter === 'DUE_SOON' ? 'bg-amber-500 border-amber-500 text-white shadow-xl shadow-amber-200' : 'bg-white border-amber-100 hover:border-amber-300'}`}
        >
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${filter === 'DUE_SOON' ? 'text-amber-100' : 'text-amber-500'}`}>Due in 7 Days</p>
              <h4 className="text-3xl font-black mt-1">{maintenanceStats.approaching}</h4>
            </div>
            <div className={`p-3 rounded-2xl ${filter === 'DUE_SOON' ? 'bg-amber-400/30' : 'bg-amber-50 text-amber-600'}`}>
              <Clock size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 relative z-10">
             <span className={`text-[10px] font-bold ${filter === 'DUE_SOON' ? 'text-amber-100' : 'text-gray-400'}`}>Upcoming maintenance tasks</span>
             <ChevronRight size={14} className={filter === 'DUE_SOON' ? 'text-amber-200' : 'text-gray-300'} />
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl text-white relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Total Fleet</p>
              <h4 className="text-3xl font-black mt-1">{maintenanceStats.total}</h4>
            </div>
            <div className="p-3 bg-slate-800 rounded-2xl text-blue-400">
              <Zap size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 relative z-10">
             <div className="flex -space-x-2">
                {vehicles.slice(0, 3).map(v => (
                   <img key={v.id} src={v.image} className="w-6 h-6 rounded-full border-2 border-slate-900 object-cover" alt="" />
                ))}
                {maintenanceStats.total > 3 && (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 text-[8px] font-bold flex items-center justify-center">+{maintenanceStats.total - 3}</div>
                )}
             </div>
             <span className="text-[10px] font-bold text-slate-400">Fleet operational health</span>
          </div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500/5 translate-x-8 translate-y-8 rounded-full"></div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search brand, model, plate..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {[ 'ALL', ...Object.values(VehicleStatus)].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filter === s 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const health = getMaintenanceHealth(vehicle);
            return (
              <div 
                key={vehicle.id} 
                onClick={() => openEditModal(vehicle)}
                className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group cursor-pointer relative"
              >
                <div className="relative h-52">
                  <img src={vehicle.image} alt={vehicle.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <p className="text-white text-sm font-bold flex items-center gap-2">
                      <Edit3 size={16} /> Click to manage vehicle
                    </p>
                  </div>
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${statusColors[vehicle.status]}`}>
                      {vehicle.status}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white border border-gray-200 text-gray-600 shadow-sm">
                      {vehicle.category}
                    </span>
                  </div>
                  {vehicle.nextServiceDate && (
                    <div className={`absolute bottom-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm bg-white 
                      ${health.color === 'red' ? 'text-red-600 border-red-100' : 
                        health.color === 'amber' ? 'text-amber-600 border-amber-100' : 'text-emerald-600 border-emerald-100'}`}>
                      {health.label}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{vehicle.brand} {vehicle.model}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                          {vehicle.plateNumber}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-black text-blue-600">
                        {settings.currency}{vehicle.dailyRate}
                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-tighter">per day</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    {vehicle.maintenanceNotes && (
                      <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-100 rounded-xl">
                        <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-amber-700 line-clamp-2 leading-relaxed">
                          {vehicle.maintenanceNotes}
                        </p>
                      </div>
                    )}
                    {vehicle.nextServiceDate && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded-xl">
                         <div className="flex items-center gap-2">
                           <Calendar size={14} className="text-gray-400" />
                           <span className="text-[11px] font-bold text-gray-600">Next: {vehicle.nextServiceDate}</span>
                         </div>
                         <span className="text-[10px] font-black uppercase text-blue-500">{vehicle.nextServiceType}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-600">KM</div>
                      <span className="text-xs font-bold text-gray-900">{vehicle.currentMileage?.toLocaleString() || 0}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateVehicle(vehicle.id, { 
                          status: vehicle.status === VehicleStatus.MAINTENANCE ? VehicleStatus.AVAILABLE : VehicleStatus.MAINTENANCE 
                        });
                      }}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors border ${
                        vehicle.status === VehicleStatus.MAINTENANCE 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {vehicle.status === VehicleStatus.MAINTENANCE ? 'Mark Ready' : 'Send to Service'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
           <Search size={48} className="mx-auto text-gray-200 mb-4" />
           <p className="text-lg font-bold text-gray-900">No vehicles found</p>
           <p className="text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
           <button 
             onClick={() => { setFilter('ALL'); setSearchTerm(''); }}
             className="mt-6 text-sm font-bold text-blue-600 hover:underline"
           >
             Clear All Filters
           </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {modalMode === 'add' ? 'Register New Vehicle' : 'Manage Vehicle'}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {modalMode === 'add' ? 'Add a new member to your fleet.' : `${formState.brand} ${formState.model} - ${formState.plateNumber}`}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {modalMode === 'edit' && (
              <div className="flex border-b border-gray-100 bg-gray-50/30">
                <button 
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  General Details
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Maintenance Log & History
                </button>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeTab === 'details' ? (
                <form onSubmit={handleSaveVehicle} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Brand</label>
                      <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" 
                        value={formState.brand} onChange={e => setFormState({...formState, brand: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Model</label>
                      <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" 
                        value={formState.model} onChange={e => setFormState({...formState, model: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Category</label>
                      <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-700"
                        value={formState.category} onChange={e => setFormState({...formState, category: e.target.value as VehicleCategory})}>
                        {VEHICLE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Plate Number</label>
                      <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono font-bold" 
                        value={formState.plateNumber} onChange={e => setFormState({...formState, plateNumber: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Daily Rate ({settings.currency})</label>
                      <input required type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-blue-600" 
                        value={formState.dailyRate} onChange={e => setFormState({...formState, dailyRate: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Current Odometer (KM)</label>
                      <input required type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" 
                        value={formState.currentMileage} onChange={e => setFormState({...formState, currentMileage: Number(e.target.value)})} />
                    </div>
                  </div>

                  <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-4">
                    <h4 className="text-sm font-black text-blue-900 uppercase flex items-center gap-2">
                      <Wrench size={16} /> Schedule Next Appointment
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Next Due Date</label>
                        <input type="date" className="w-full px-4 py-2 bg-white border border-blue-100 rounded-xl outline-none text-sm font-bold"
                          value={formState.nextServiceDate} onChange={e => setFormState({...formState, nextServiceDate: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Appointment Type</label>
                        <select className="w-full px-4 py-2 bg-white border border-blue-100 rounded-xl outline-none text-sm font-bold"
                          value={formState.nextServiceType} onChange={e => setFormState({...formState, nextServiceType: e.target.value})}>
                          {SERVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
                    {modalMode === 'add' ? 'Add Vehicle to Fleet' : 'Save General Changes'}
                  </button>
                </form>
              ) : (
                <div className="p-8 space-y-8">
                  {/* Log New Service */}
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                    <h4 className="text-sm font-black text-gray-900 uppercase flex items-center gap-2">
                      <Plus size={18} className="text-blue-600" /> Log Completed Service
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Service Date</label>
                        <input type="date" className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none text-sm font-bold"
                          value={logState.date} onChange={e => setLogState({...logState, date: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Service Type</label>
                        <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none text-sm font-bold"
                          value={logState.type} onChange={e => setLogState({...logState, type: e.target.value})}>
                          {SERVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cost ({settings.currency})</label>
                        <div className="relative">
                          <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="number" className="w-full pl-8 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none text-sm font-bold text-emerald-600"
                            value={logState.cost} onChange={e => setLogState({...logState, cost: Number(e.target.value)})} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Odometer at Service (KM)</label>
                        <input type="number" className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none text-sm font-bold"
                          value={logState.mileage} onChange={e => setLogState({...logState, mileage: Number(e.target.value)})} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Detailed Technician Notes</label>
                      <textarea className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-sm min-h-[100px] resize-none"
                        placeholder="e.g. Oil change completed using 5W-30 synthetic oil. Filter replaced. Front brake pads at 40%."
                        value={logState.notes} onChange={e => setLogState({...logState, notes: e.target.value})} />
                    </div>
                    <button 
                      type="button"
                      onClick={handleLogMaintenance}
                      className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} /> Confirm & Log Service
                    </button>
                  </div>

                  {/* History List */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-gray-900 uppercase flex items-center gap-2">
                      <History size={18} className="text-blue-600" /> Maintenance History
                    </h4>
                    <div className="space-y-3">
                      {formState.maintenanceHistory && formState.maintenanceHistory.length > 0 ? (
                        formState.maintenanceHistory.map((record) => (
                          <div key={record.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                  <Wrench size={16} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{record.type}</p>
                                  <p className="text-[10px] text-gray-500 font-bold uppercase">{record.date}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-emerald-600">{settings.currency}{record.cost.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400 font-bold">{record.mileageAtService.toLocaleString()} KM</p>
                              </div>
                            </div>
                            {record.notes && (
                              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-xs text-gray-600 leading-relaxed italic flex items-start gap-2">
                                  <FileText size={12} className="mt-0.5 shrink-0 text-gray-400" />
                                  {record.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                           <History size={40} className="mx-auto text-gray-300 mb-2" />
                           <p className="text-sm text-gray-400 font-medium">No service history recorded for this vehicle.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
