
import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Car, 
  CalendarDays, 
  Users, 
  Settings, 
  Menu, 
  X,
  Bell,
  Search,
  Receipt,
  Calculator,
  AlertTriangle,
  Clock,
  ChevronRight,
  Check
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Bookings from './pages/Bookings';
import Customers from './pages/Customers';
import AvailabilityCalendar from './pages/AvailabilityCalendar';
import Transactions from './pages/Transactions';
import Estimator from './pages/Estimator';
import SettingsPage from './pages/Settings';
import { useRentFlowStore } from './store';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const { vehicles } = useRentFlowStore();

  const maintenanceAlerts = useMemo(() => {
    const now = new Date();
    const alerts = vehicles.filter(v => v.nextServiceDate).map(v => {
      const next = new Date(v.nextServiceDate!);
      const diff = next.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      
      return {
        ...v,
        daysToService: days,
        isOverdue: days < 0,
        isApproaching: days >= 0 && days <= 7
      };
    }).filter(v => v.isOverdue || v.isApproaching)
    .sort((a, b) => a.daysToService - b.daysToService);
    
    return alerts;
  }, [vehicles]);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', name: 'Vehicles', icon: Car },
    { id: 'bookings', name: 'Bookings', icon: CalendarDays },
    { id: 'calendar', name: 'Availability', icon: CalendarDays },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'transactions', name: 'Transactions', icon: Receipt },
    { id: 'estimator', name: 'Estimator', icon: Calculator },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'vehicles': return <Vehicles />;
      case 'bookings': return <Bookings />;
      case 'calendar': return <AvailabilityCalendar setActiveTab={setActiveTab} />;
      case 'customers': return <Customers />;
      case 'transactions': return <Transactions />;
      case 'estimator': return <Estimator />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  const navigateToVehicleAlert = (vehicleId: string) => {
    setActiveTab('vehicles');
    setIsNotifOpen(false);
    // In a real app we might scroll to or filter by this ID
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 bg-slate-900 text-white flex flex-col h-full z-30`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shrink-0">
            <Car size={24} />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">RentFlow</span>}
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors rounded-xl ${
              activeTab === 'settings' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings size={20} />
            {isSidebarOpen && <span>Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={18} />
              <input 
                type="text" 
                placeholder="Quick search..." 
                className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full w-64 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative p-2 rounded-lg transition-all ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Bell size={20} />
              {maintenanceAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
                  {maintenanceAlerts.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                <div className="absolute right-0 top-12 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h4 className="font-bold text-gray-900">Notifications</h4>
                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {maintenanceAlerts.length} Alert{maintenanceAlerts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {maintenanceAlerts.length > 0 ? (
                      <div className="divide-y divide-gray-50">
                        {maintenanceAlerts.map(alert => (
                          <div 
                            key={alert.id} 
                            onClick={() => navigateToVehicleAlert(alert.id)}
                            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                          >
                            <div className="flex gap-3">
                              <div className={`p-2 rounded-xl h-fit ${alert.isOverdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                <AlertTriangle size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <p className="text-sm font-bold text-gray-900 truncate">
                                    {alert.brand} {alert.model}
                                  </p>
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${alert.isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {alert.isOverdue ? 'Overdue' : 'Due Soon'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {alert.nextServiceType} required. Plate: {alert.plateNumber}
                                </p>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                    <Clock size={10} /> 
                                    {alert.isOverdue ? `${Math.abs(alert.daysToService)}d late` : `In ${alert.daysToService} days`}
                                  </span>
                                  <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="bg-gray-50 p-4 rounded-full w-fit mx-auto mb-4 text-gray-300">
                           <Bell size={32} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">All caught up!</p>
                        <p className="text-xs text-gray-400 mt-1">No maintenance alerts at the moment.</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-50 bg-gray-50/30">
                    <button 
                      onClick={() => { setActiveTab('vehicles'); setIsNotifOpen(false); }}
                      className="w-full py-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      View Fleet Health
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-none">Admin User</p>
                <p className="text-xs text-gray-500 mt-1">Administrator</p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                AU
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 custom-scrollbar">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
