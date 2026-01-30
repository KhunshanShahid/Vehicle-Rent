
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Vehicle, Booking, Customer, VehicleStatus, BookingStatus, PaymentStatus, Transaction, PaymentMethod, RentalSettings, VehicleCategory } from './types';

interface RentFlowState {
  vehicles: Vehicle[];
  bookings: Booking[];
  customers: Customer[];
  transactions: Transaction[];
  settings: RentalSettings;
  draftBooking: { vehicleId?: string, date: string } | null;
  
  addVehicle: (v: Omit<Vehicle, 'id'>) => void;
  bulkAddVehicles: (vs: Omit<Vehicle, 'id'>[]) => void;
  updateVehicle: (id: string, v: Partial<Vehicle>) => void;
  addBooking: (b: Omit<Booking, 'id'>) => void;
  updateBooking: (id: string, b: Partial<Booking>) => void;
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => void;
  addTransaction: (t: Omit<Transaction, 'id' | 'date'>) => void;
  updateSettings: (s: Partial<RentalSettings>) => void;
  setDraftBooking: (draft: { vehicleId?: string, date: string } | null) => void;
}

const defaultSettings: RentalSettings = {
  taxRate: 15,
  insuranceDailyRate: 15,
  lateFeePerHour: 20,
  currency: '$',
  companyName: 'RentFlow Elite Fleet',
  companyEmail: 'ops@rentflow.io',
  companyAddress: '123 Enterprise Way, Silicon Valley, CA'
};

const getFutureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const initialVehicles: Vehicle[] = [
  { id: 'v1', brand: 'Toyota', model: 'Camry', plateNumber: 'ABC-1234', category: VehicleCategory.SEDAN, status: VehicleStatus.AVAILABLE, dailyRate: 50, maintenanceNotes: '', image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=400&h=300&auto=format&fit=crop', currentMileage: 12500, color: 'Silver', colorHex: '#C0C0C0', lastServiceDate: '2024-10-01', nextServiceDate: getFutureDate(5), nextServiceType: 'Oil Change' },
  { id: 'v2', brand: 'Honda', model: 'CR-V', plateNumber: 'XYZ-5678', category: VehicleCategory.SUV, status: VehicleStatus.AVAILABLE, dailyRate: 75, maintenanceNotes: '', image: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?q=80&w=400&h=300&auto=format&fit=crop', currentMileage: 45000, color: 'White', colorHex: '#FFFFFF', lastServiceDate: '2024-08-15', nextServiceDate: getFutureDate(30), nextServiceType: 'Brake Inspection' },
  { id: 'v3', brand: 'BMW', model: '4 Series', plateNumber: 'LUX-99', category: VehicleCategory.LUXURY, status: VehicleStatus.AVAILABLE, dailyRate: 180, maintenanceNotes: '', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=400&h=300&auto=format&fit=crop', currentMileage: 5000, color: 'Black', colorHex: '#000000', lastServiceDate: '2024-11-20', nextServiceDate: getFutureDate(120), nextServiceType: 'Full Service' },
  { id: 'v4', brand: 'Tesla', model: 'Model 3', plateNumber: 'EV-442', category: VehicleCategory.LUXURY, status: VehicleStatus.AVAILABLE, dailyRate: 120, maintenanceNotes: '', image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=400&h=300&auto=format&fit=crop', currentMileage: 2100, color: 'Red', colorHex: '#FF0000', lastServiceDate: '2025-01-05', nextServiceDate: getFutureDate(180), nextServiceType: 'Tire Rotation' },
  { id: 'v5', brand: 'Ford', model: 'F-150', plateNumber: 'TRK-001', category: VehicleCategory.PICKUP, status: VehicleStatus.AVAILABLE, dailyRate: 90, maintenanceNotes: 'Check transmission', image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=400&h=300&auto=format&fit=crop', currentMileage: 18500, color: 'Blue', colorHex: '#0000FF', lastServiceDate: '2024-05-10', nextServiceDate: getFutureDate(-2), nextServiceType: 'Brake Inspection' },
];

export const useRentFlowStore = create<RentFlowState>()(
  persist(
    (set) => ({
      vehicles: initialVehicles,
      bookings: [],
      customers: [],
      transactions: [],
      settings: defaultSettings,
      draftBooking: null,

      addVehicle: (v) => set((state) => ({ 
        vehicles: [...state.vehicles, { ...v, id: Math.random().toString(36).substr(2, 9) }] 
      })),

      bulkAddVehicles: (vs) => set((state) => ({
        vehicles: [
          ...state.vehicles,
          ...vs.map(v => ({ ...v, id: Math.random().toString(36).substr(2, 9) }))
        ]
      })),
      
      updateVehicle: (id, updates) => set((state) => ({
        vehicles: state.vehicles.map(v => v.id === id ? { ...v, ...updates } : v)
      })),

      addBooking: (b) => set((state) => ({
        bookings: [...state.bookings, { ...b, id: Math.random().toString(36).substr(2, 9) }]
      })),

      updateBooking: (id, updates) => set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, ...updates } : b)
      })),

      addCustomer: (c) => set((state) => ({
        customers: [...state.customers, { 
          ...c, 
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString() 
        }]
      })),

      addTransaction: (t) => set((state) => ({
        transactions: [...state.transactions, { 
          ...t, 
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString() 
        }]
      })),

      updateSettings: (s) => set((state) => ({
        settings: { ...state.settings, ...s }
      })),

      setDraftBooking: (draft) => set({ draftBooking: draft }),
    }),
    { name: 'rentflow-saas-v1' }
  )
);
