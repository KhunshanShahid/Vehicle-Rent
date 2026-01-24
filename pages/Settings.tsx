
import React from 'react';
import { 
  ShieldCheck, 
  Percent, 
  Banknote, 
  Clock, 
  Save, 
  Building2, 
  Car,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { useRentFlowStore } from '../store';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, vehicles, updateVehicle } = useRentFlowStore();

  const handleUpdate = (key: string, value: any) => {
    updateSettings({ [key]: value });
  };

  const handleVehicleRateChange = (id: string, rate: number) => {
    updateVehicle(id, { dailyRate: rate });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
        <p className="text-gray-500">Configure multi-vehicle rental rules and individual vehicle rates.</p>
      </div>

      {/* Quick Rate Management */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-50 text-blue-600">
          <div className="p-2 bg-blue-50 rounded-xl">
            <TrendingUp size={20} />
          </div>
          <h3 className="font-bold text-gray-900">Individual Vehicle Daily Rates</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vehicles.map(v => (
            <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <img src={v.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                <div>
                  <p className="text-xs font-bold text-gray-900">{v.brand} {v.model}</p>
                  <p className="text-[10px] text-gray-500">{v.plateNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold">{settings.currency}</span>
                <input 
                  type="number" 
                  value={v.dailyRate}
                  onChange={(e) => handleVehicleRateChange(v.id, Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-white border border-gray-200 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Financial Settings */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-50 text-indigo-600">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Banknote size={20} />
            </div>
            <h3 className="font-bold text-gray-900">General Pricing</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">Global Currency</label>
              <input 
                type="text" 
                value={settings.currency}
                onChange={(e) => handleUpdate('currency', e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">Tax Rate (%)</label>
              <div className="relative">
                <Percent size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="number" 
                  value={settings.taxRate}
                  onChange={(e) => handleUpdate('taxRate', Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Insurance & Fees */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-50 text-emerald-600">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-gray-900">Protection Rates</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">Daily Insurance (per vehicle)</label>
              <input 
                type="number" 
                value={settings.insuranceDailyRate}
                onChange={(e) => handleUpdate('insuranceDailyRate', Number(e.target.value))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">Late Fee (per vehicle/hour)</label>
              <input 
                type="number" 
                value={settings.lateFeePerHour}
                onChange={(e) => handleUpdate('lateFeePerHour', Number(e.target.value))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
          <Save size={20} />
          Save Global Config
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
