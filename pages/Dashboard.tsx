
import React from 'react';
import { 
  Car, 
  CalendarCheck, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Zap
} from 'lucide-react';
import { useRentFlowStore } from '../store';
import { VehicleStatus, BookingStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard: React.FC<{ setActiveTab: (t: string) => void }> = ({ setActiveTab }) => {
  const { vehicles, bookings, customers, setDraftBooking } = useRentFlowStore();

  const activeBookings = bookings.filter(b => b.status === BookingStatus.ACTIVE);
  const totalRentedVehicles = activeBookings.reduce((sum, b) => sum + b.vehicleIds.length, 0);

  const handleQuickAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setDraftBooking({ date: today });
    setActiveTab('bookings');
  };

  const stats = [
    { 
      label: 'Vehicles Out', 
      value: totalRentedVehicles, 
      icon: Car, 
      color: 'blue', 
      trend: '+12%',
      id: 'bookings'
    },
    { 
      label: 'Available Today', 
      value: vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length, 
      icon: CalendarCheck, 
      color: 'emerald', 
      trend: '-2%',
      id: 'vehicles'
    },
    { 
      label: 'Upcoming Returns', 
      value: activeBookings.length, 
      icon: Clock, 
      color: 'orange', 
      trend: 'Today',
      id: 'bookings'
    },
    { 
      label: 'Month Revenue', 
      value: `$${bookings.reduce((acc, b) => acc + b.totalAmount, 0).toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'indigo',
      trend: '+8.5%',
      id: 'dashboard'
    },
  ];

  const chartData = [
    { name: 'Mon', total: 400 },
    { name: 'Tue', total: 300 },
    { name: 'Wed', total: 200 },
    { name: 'Thu', total: 578 },
    { name: 'Fri', total: 189 },
    { name: 'Sat', total: 239 },
    { name: 'Sun', total: 349 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleQuickAdd}
            className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-amber-600 transition-all shadow-lg shadow-amber-200"
          >
            <Zap size={18} />
            Quick Add Today
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <CalendarCheck size={18} />
            New Booking
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div 
            key={stat.label}
            onClick={() => setActiveTab(stat.id)}
            className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all cursor-pointer group shadow-sm hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full bg-green-50 text-green-600`}>
                {stat.trend}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900">Revenue Analysis</h3>
            <select className="text-sm bg-gray-50 border-none rounded-lg px-3 py-1 text-gray-600 focus:ring-0">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 3 ? '#2563eb' : '#dbeafe'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-6">
            {bookings.slice(0, 4).map((booking) => {
              const customer = customers.find(c => c.id === booking.customerId);
              return (
                <div key={booking.id} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Car size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{customer?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{booking.vehicleIds.length} Vehicles · {booking.fromLocation} → {booking.toLocation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${booking.totalAmount}</p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      booking.status === BookingStatus.ACTIVE ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
            <AlertCircle className="text-amber-600 shrink-0" size={20} />
            <div>
              <p className="text-sm font-semibold text-amber-900">Maintenance Due</p>
              <p className="text-xs text-amber-700 mt-0.5">Toyota Camry needs service soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
