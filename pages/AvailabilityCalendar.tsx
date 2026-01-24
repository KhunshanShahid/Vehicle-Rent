
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Plus } from 'lucide-react';
import { useRentFlowStore } from '../store';
import { BookingStatus, VehicleStatus } from '../types';

interface AvailabilityCalendarProps {
  setActiveTab?: (tab: string) => void;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ setActiveTab }) => {
  const { vehicles, bookings, setDraftBooking } = useRentFlowStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDays = () => {
    const days = [];
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const days = getDays();

  const getBookingForDay = (vehicleId: string, date: Date) => {
    return bookings.find(b => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const current = new Date(date);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      current.setHours(0, 0, 0, 0);
      
      return b.vehicleIds.includes(vehicleId) && 
             b.status !== BookingStatus.CANCELLED &&
             current >= start && 
             current <= end;
    });
  };

  const shiftDate = (amount: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + amount);
    setCurrentDate(next);
  };

  const handleCellClick = (vehicleId: string, date: Date) => {
    const isoDate = date.toISOString().split('T')[0];
    setDraftBooking({ vehicleId, date: isoDate });
    if (setActiveTab) {
      setActiveTab('bookings');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Availability</h1>
          <p className="text-gray-500">Click any empty cell to quick-book a vehicle.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <button onClick={() => shiftDate(-7)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 flex items-center gap-2 font-semibold text-gray-700 min-w-[180px] justify-center">
            <CalendarIcon size={16} className="text-blue-500" />
            {currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - 
            {days[13].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <button onClick={() => shiftDate(7)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex gap-6 text-xs font-bold uppercase tracking-wider text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span> Available
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span> Booked
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span> Maintenance
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-white p-4 border-b border-r border-gray-100 min-w-[200px] text-left">
                  <span className="text-xs font-bold text-gray-400 uppercase">Vehicle</span>
                </th>
                {days.map((day, idx) => (
                  <th key={idx} className={`p-4 border-b border-gray-100 min-w-[80px] text-center ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-50' : ''}`}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{day.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                    <p className={`text-sm font-bold mt-1 ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-900'}`}>
                      {day.getDate()}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="sticky left-0 z-10 bg-white p-4 border-b border-r border-gray-100 group">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        <img src={vehicle.image} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-[10px] font-mono text-gray-500 truncate uppercase">{vehicle.plateNumber}</p>
                      </div>
                    </div>
                  </td>
                  {days.map((day, idx) => {
                    const booking = getBookingForDay(vehicle.id, day);
                    const isMaintenance = vehicle.status === VehicleStatus.MAINTENANCE && !booking;
                    const isToday = day.toDateString() === new Date().toDateString();
                    
                    return (
                      <td key={idx} className={`p-2 border-b border-gray-100 text-center relative ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-50/50' : ''}`}>
                        {booking ? (
                          <div 
                            className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase text-white shadow-sm cursor-default
                              ${booking.status === BookingStatus.ACTIVE ? 'bg-blue-600' : 'bg-blue-400'}
                            `}
                          >
                            {new Date(booking.startDate).toDateString() === day.toDateString() ? "START" : ""}
                          </div>
                        ) : isMaintenance ? (
                          <div className="h-8 rounded-lg bg-amber-400/20 border border-amber-200 flex items-center justify-center text-amber-600">
                             <Info size={14} />
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleCellClick(vehicle.id, day)}
                            className="w-full h-8 rounded-lg border border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center text-transparent hover:text-blue-500 group/cell"
                          >
                            <Plus size={14} className="opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
