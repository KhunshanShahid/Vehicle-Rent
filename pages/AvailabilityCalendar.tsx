
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
    // Format local date YYYY-MM-DD to avoid UTC timezone shifts
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    const isoDate = localDate.toISOString().split('T')[0];
    
    setDraftBooking({ vehicleId, date: isoDate });
    if (setActiveTab) {
      setActiveTab('bookings');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Availability</h1>
          <p className="text-gray-500">Real-time schedule. Click an empty slot to create a new booking.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <button onClick={() => shiftDate(-7)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 flex items-center gap-2 font-semibold text-gray-700 min-w-[200px] justify-center">
            <CalendarIcon size={16} className="text-blue-500" />
            <span className="text-sm whitespace-nowrap">
              {days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - 
              {days[13].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <button onClick={() => shiftDate(7)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Available
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm"></span> Rented / Active
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-sm"></span> Reserved
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm"></span> Maintenance
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-30 bg-white p-6 border-b border-r border-gray-100 min-w-[240px] text-left">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-[0.1em]">Vehicle Fleet</span>
                </th>
                {days.map((day, idx) => (
                  <th key={idx} className={`p-4 border-b border-gray-100 min-w-[85px] text-center ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-50/30' : ''}`}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{day.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                    <div className={`mt-1.5 flex items-center justify-center w-8 h-8 mx-auto rounded-full font-bold text-sm ${day.toDateString() === new Date().toDateString() ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-900'}`}>
                      {day.getDate()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="group/row">
                  <td className="sticky left-0 z-20 bg-white p-4 border-r border-gray-100 group-hover/row:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-50 shadow-sm">
                        <img src={vehicle.image} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate leading-tight">{vehicle.brand} {vehicle.model}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-2 h-2 rounded-full border border-gray-200" style={{ backgroundColor: vehicle.colorHex }}></div>
                          <p className="text-[10px] font-mono font-bold text-gray-400 truncate uppercase">{vehicle.plateNumber}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  {days.map((day, idx) => {
                    const booking = getBookingForDay(vehicle.id, day);
                    const isMaintenance = vehicle.status === VehicleStatus.MAINTENANCE && !booking;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    
                    return (
                      <td key={idx} className={`p-2 border-r border-gray-50 text-center relative ${isWeekend ? 'bg-gray-50/20' : ''}`}>
                        {booking ? (
                          <div 
                            className={`h-9 rounded-xl flex items-center justify-center text-[9px] font-black uppercase text-white shadow-sm transition-all
                              ${booking.status === BookingStatus.ACTIVE ? 'bg-blue-600' : 'bg-blue-400'}
                            `}
                            title={`Booked: ${booking.id}`}
                          >
                            {new Date(booking.startDate).toDateString() === day.toDateString() ? (
                              <span className="px-1 truncate">Starts</span>
                            ) : new Date(booking.endDate).toDateString() === day.toDateString() ? (
                              <span className="px-1 truncate">Ends</span>
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                            )}
                          </div>
                        ) : isMaintenance ? (
                          <div className="h-9 rounded-xl bg-amber-400/10 border border-amber-200/50 flex items-center justify-center text-amber-600" title="In Maintenance">
                             <Info size={14} />
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleCellClick(vehicle.id, day)}
                            className="w-full h-9 rounded-xl border border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-center group/cell"
                            title="Click to book"
                          >
                            <Plus size={16} className="text-blue-500 opacity-0 group-hover/cell:opacity-100 group-hover/cell:scale-110 transition-all" />
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
