
import React, { useState, useRef } from 'react';
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
  Tool,
  Clock,
  History
} from 'lucide-react';
import { useRentFlowStore } from '../store';
import { VehicleStatus, Vehicle } from '../types';

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

const Vehicles: React.FC = () => {
  const { vehicles, addVehicle, bulkAddVehicles, updateVehicle, settings } = useRentFlowStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<VehicleStatus | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<Vehicle>>({
    brand: '',
    model: '',
    plateNumber: '',
    category: 'Sedan',
    status: VehicleStatus.AVAILABLE,
    dailyRate: 0,
    maintenanceNotes: '',
    image: '',
    color: 'Silver',
    colorHex: '#C0C0C0',
    lastServiceDate: '',
    nextServiceDate: '',
    nextServiceType: 'Oil Change'
  });

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || v.status === filter;
    return matchesSearch && matchesFilter;
  });

  const openAddModal = () => {
    setModalMode('add');
    setEditingVehicleId(null);
    setFormState({
      brand: '',
      model: '',
      plateNumber: '',
      category: 'Sedan',
      status: VehicleStatus.AVAILABLE,
      dailyRate: 0,
      maintenanceNotes: '',
      image: 'https://picsum.photos/seed/' + Math.random() + '/400/300',
      color: 'Silver',
      colorHex: '#C0C0C0',
      lastServiceDate: new Date().toISOString().split('T')[0],
      nextServiceDate: '',
      nextServiceType: 'Oil Change'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setModalMode('edit');
    setEditingVehicleId(vehicle.id);
    setFormState({ ...vehicle });
    setIsModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.brand && formState.model && formState.plateNumber) {
      if (modalMode === 'add') {
        addVehicle(formState as Omit<Vehicle, 'id'>);
      } else if (editingVehicleId) {
        updateVehicle(editingVehicleId, formState);
      }
      setIsModalOpen(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Brand', 'Model', 'Plate Number', 'Category', 'Status', 'Daily Rate', 'Mileage', 'Color', 'ColorHex', 'Maintenance Notes', 'Image URL', 'Last Service', 'Next Service', 'Service Type'];
    const rows = vehicles.map(v => [
      v.brand,
      v.model,
      v.plateNumber,
      v.category,
      v.status,
      v.dailyRate,
      v.currentMileage,
      v.color,
      v.colorHex,
      v.maintenanceNotes.replace(/,/g, ';'),
      v.image,
      v.lastServiceDate || '',
      v.nextServiceDate || '',
      v.nextServiceType || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rentflow_fleet_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const newVehicles: Omit<Vehicle, 'id'>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');
        if (parts.length < 4) continue;

        newVehicles.push({
          brand: parts[0] || 'Unknown',
          model: parts[1] || 'Unknown',
          plateNumber: parts[2] || 'TBD-' + Math.floor(Math.random() * 1000),
          category: parts[3] || 'Sedan',
          status: (parts[4] as VehicleStatus) || VehicleStatus.AVAILABLE,
          dailyRate: Number(parts[5]) || 50,
          currentMileage: Number(parts[6]) || 0,
          color: parts[7] || 'Silver',
          colorHex: parts[8] || '#C0C0C0',
          maintenanceNotes: parts[9] || '',
          image: parts[10] || 'https://picsum.photos/seed/' + Math.random() + '/400/300',
          lastServiceDate: parts[11] || '',
          nextServiceDate: parts[12] || '',
          nextServiceType: parts[13] || 'Oil Change'
        });
      }

      if (newVehicles.length > 0) {
        bulkAddVehicles(newVehicles);
        alert(`Successfully imported ${newVehicles.length} vehicles!`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getMaintenanceHealth = (v: Vehicle) => {
    if (!v.nextServiceDate) return { label: 'Unknown', color: 'gray', overdue: false };
    const next = new Date(v.nextServiceDate);
    const now = new Date();
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
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm"
          >
            <Upload size={18} />
            Import CSV
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={18} />
            Add Vehicle
          </button>
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
          {['ALL', VehicleStatus.AVAILABLE, VehicleStatus.RENTED, VehicleStatus.MAINTENANCE].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filter === s 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

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
                    <Edit3 size={16} /> Click to edit details
                  </p>
                </div>
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${statusColors[vehicle.status]}`}>
                    {vehicle.status}
                  </span>
                  {vehicle.nextServiceDate && (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm bg-white 
                      ${health.color === 'red' ? 'text-red-600 border-red-100' : 
                        health.color === 'amber' ? 'text-amber-600 border-amber-100' : 'text-emerald-600 border-emerald-100'}`}>
                      {health.label}
                    </span>
                  )}
                </div>
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <div className="p-2 bg-white/90 backdrop-blur rounded-xl shadow-lg text-blue-600">
                    <Settings size={18} />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{vehicle.brand} {vehicle.model}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        {vehicle.plateNumber}
                      </span>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                        <div className="w-2 h-2 rounded-full border border-gray-300" style={{ backgroundColor: vehicle.colorHex }}></div>
                        {vehicle.color}
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
                    <span className="text-xs font-bold text-gray-900">{vehicle.currentMileage.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      updateVehicle(vehicle.id, { 
                        status: vehicle.status === VehicleStatus.AVAILABLE ? VehicleStatus.MAINTENANCE : VehicleStatus.AVAILABLE 
                      });
                    }}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors border ${
                      vehicle.status === VehicleStatus.MAINTENANCE 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {vehicle.status === VehicleStatus.MAINTENANCE ? 'Complete Svc' : 'Service Mode'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {modalMode === 'add' ? 'Register New Vehicle' : 'Edit Vehicle Details'}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Vehicle specs and maintenance schedule.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveVehicle} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
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
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Plate Number</label>
                  <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono font-bold" 
                    value={formState.plateNumber} onChange={e => setFormState({...formState, plateNumber: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Mileage (KM)</label>
                  <input required type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" 
                    value={formState.currentMileage} onChange={e => setFormState({...formState, currentMileage: Number(e.target.value)})} />
                </div>
              </div>

              <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-4">
                <h4 className="text-sm font-black text-blue-900 uppercase flex items-center gap-2">
                  <Clock size={16} /> Maintenance Schedule
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Last Service</label>
                    <input type="date" className="w-full px-4 py-2 bg-white border border-blue-100 rounded-xl outline-none text-sm font-bold"
                      value={formState.lastServiceDate} onChange={e => setFormState({...formState, lastServiceDate: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Next Service</label>
                    <input type="date" className="w-full px-4 py-2 bg-white border border-blue-100 rounded-xl outline-none text-sm font-bold"
                      value={formState.nextServiceDate} onChange={e => setFormState({...formState, nextServiceDate: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Service Type</label>
                  <select className="w-full px-4 py-2 bg-white border border-blue-100 rounded-xl outline-none text-sm font-bold"
                    value={formState.nextServiceType} onChange={e => setFormState({...formState, nextServiceType: e.target.value})}>
                    {SERVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Daily Rate ({settings.currency})</label>
                <input required type="number" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-blue-600" 
                  value={formState.dailyRate} onChange={e => setFormState({...formState, dailyRate: Number(e.target.value)})} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Maintenance Notes</label>
                <textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-medium min-h-[80px] resize-none" 
                  placeholder="Record any scratches, dent locations, or upcoming service requirements..."
                  value={formState.maintenanceNotes} onChange={e => setFormState({...formState, maintenanceNotes: e.target.value})} />
              </div>

              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
                {modalMode === 'add' ? 'Register Vehicle' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
