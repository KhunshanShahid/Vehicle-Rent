import React, { useState, useMemo } from 'react';
import { Calculator, Plus, Minus, Tag, ShieldCheck, ReceiptText, CalendarClock, Package, CheckCircle2 } from 'lucide-react';
import { useRentFlowStore } from '../store';

const Estimator: React.FC = () => {
  const { vehicles, settings } = useRentFlowStore();
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [days, setDays] = useState(1);
  const [includeInsurance, setIncludeInsurance] = useState(true);

  const quote = useMemo(() => {
    const baseTotal = selectedVehicleIds.reduce((acc, id) => {
      const v = vehicles.find(veh => veh.id === id);
      return acc + (v?.dailyRate || 0);
    }, 0) * days;

    const insurance = includeInsurance ? (settings.insuranceDailyRate * selectedVehicleIds.length * days) : 0;
    const tax = (baseTotal + insurance) * (settings.taxRate / 100);
    
    return {
      base: baseTotal,
      insurance,
      tax,
      total: baseTotal + insurance + tax
    };
  }, [selectedVehicleIds, days, includeInsurance, vehicles, settings]);

  const toggleVehicle = (id: string) => {
    setSelectedVehicleIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200 mb-2">
          <Calculator size={32} />
        </div>
        <h1 className="text-3xl font-black text-gray-900">Rental Quote Estimator</h1>
        <p className="text-gray-500">Fast pricing for single or multiple vehicle packages.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Vehicles */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">1</span>
              Select Vehicles for Package
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {vehicles.map(v => (
                <button
                  key={v.id}
                  onClick={() => toggleVehicle(v.id)}
                  className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all text-left group relative ${
                    selectedVehicleIds.includes(v.id) 
                      ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-600/10 scale-[1.02] shadow-lg shadow-blue-100' 
                      : 'border-gray-50 bg-gray-50 hover:border-gray-200 hover:bg-white hover:shadow-md'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img 
                      src={v.image || `https://picsum.photos/seed/${v.id}/200/150`} 
                      className={`w-24 h-16 rounded-2xl object-cover bg-gray-200 shadow-sm transition-all duration-300 ${
                        selectedVehicleIds.includes(v.id) ? 'scale-105 brightness-110' : 'group-hover:scale-105'
                      }`} 
                      alt={v.model} 
                      referrerPolicy="no-referrer"
                    />
                    {selectedVehicleIds.includes(v.id) && (
                      <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1.5 shadow-lg border-2 border-white animate-in zoom-in-50">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        selectedVehicleIds.includes(v.id) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {v.category}
                      </span>
                    </div>
                    <p className="text-sm font-black text-gray-900 truncate leading-tight">{v.brand} {v.model}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-sm font-black text-blue-600">{settings.currency}{v.dailyRate.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">/ day</span>
                    </div>
                  </div>
                  
                  {/* Selection Indicator Bar */}
                  {selectedVehicleIds.includes(v.id) && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-blue-600 rounded-r-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Duration */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">2</span>
                <h3 className="font-bold text-gray-900">Rental Duration</h3>
             </div>
             <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-200">
                <button 
                  onClick={() => setDays(Math.max(1, days - 1))}
                  className="p-2 bg-white rounded-xl shadow-sm hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <Minus size={18} />
                </button>
                <div className="flex flex-col items-center min-w-[60px]">
                  <span className="text-xl font-black text-gray-900 leading-none">{days}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Days</span>
                </div>
                <button 
                  onClick={() => setDays(days + 1)}
                  className="p-2 bg-white rounded-xl shadow-sm hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <Plus size={18} />
                </button>
             </div>
          </div>

          {/* Step 3: Add-ons */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">3</span>
              Protection & Add-ons
            </h3>
            <button 
              onClick={() => setIncludeInsurance(!includeInsurance)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                includeInsurance ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${includeInsurance ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <ShieldCheck size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Collision Damage Waiver</p>
                  <p className="text-sm text-gray-500">Full coverage for all vehicles in package</p>
                </div>
              </div>
              <p className="font-bold text-emerald-600">+{settings.currency}{settings.insuranceDailyRate}/day</p>
            </button>
          </div>
        </div>

        {/* Quote Breakdown Sticky */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 text-white rounded-3xl shadow-2xl p-6 sticky top-8 overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-white">
              <Calculator size={120} />
            </div>
            
            <h3 className="text-xl font-bold flex items-center gap-2 relative z-10">
              <ReceiptText size={20} className="text-blue-400" />
              Quote Summary
            </h3>

            <div className="mt-8 space-y-4 relative z-10">
              <div className="flex justify-between items-center text-gray-400 text-sm">
                <span className="flex items-center gap-2"><Package size={14} /> Vehicles ({selectedVehicleIds.length})</span>
                <span className="font-bold text-white">{settings.currency}{quote.base.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400 text-sm">
                <span className="flex items-center gap-2"><CalendarClock size={14} /> Duration</span>
                <span className="font-bold text-white">{days} Days</span>
              </div>
              <div className="flex justify-between items-center text-gray-400 text-sm">
                <span className="flex items-center gap-2"><ShieldCheck size={14} /> Insurance</span>
                <span className="font-bold text-white">{settings.currency}{quote.insurance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400 text-sm">
                <span className="flex items-center gap-2"><Tag size={14} /> Tax ({settings.taxRate}%)</span>
                <span className="font-bold text-white">{settings.currency}{quote.tax.toLocaleString()}</span>
              </div>

              <div className="h-px bg-slate-800 my-4"></div>

              <div className="flex justify-between items-end pt-2">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Total Estimate</span>
                <span className="text-3xl font-black text-blue-400">{settings.currency}{quote.total.toLocaleString()}</span>
              </div>
            </div>

            <button 
              disabled={selectedVehicleIds.length === 0}
              className={`w-full mt-8 py-4 rounded-2xl font-bold transition-all relative z-10 ${
                selectedVehicleIds.length > 0 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/50' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Convert to Booking
            </button>

            <p className="mt-6 text-[10px] text-slate-500 text-center relative z-10 leading-relaxed">
              This is an estimated quote based on current rates. Taxes and insurance are calculated based on your global settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estimator;