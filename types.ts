
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF'
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  UNAVAILABLE = 'UNAVAILABLE'
}

export enum VehicleCategory {
  SEDAN = 'Sedan',
  SUV = 'SUV',
  TRUCK = 'Truck',
  LUXURY = 'Luxury',
  VAN = 'Van',
  PICKUP = 'Pickup',
  COUPE = 'Coupe'
}

export enum BookingStatus {
  RESERVED = 'RESERVED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER'
}

export interface RentalSettings {
  taxRate: number;
  insuranceDailyRate: number;
  lateFeePerHour: number;
  currency: string;
  companyName: string;
  companyEmail: string;
  companyAddress: string;
  technicianPhone: string;
}

export interface Transaction {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  type: 'RENTAL_FEE' | 'DEPOSIT' | 'REFUND' | 'EXTRA_FEE';
  date: string;
  note: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  notes: string;
  cost: number;
  mileageAtService: number;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  brand: string;
  category: VehicleCategory;
  status: VehicleStatus;
  dailyRate: number;
  maintenanceNotes: string;
  image: string;
  currentMileage: number;
  color: string;
  colorHex: string;
  // Maintenance tracking
  lastServiceDate?: string;
  nextServiceDate?: string;
  nextServiceType?: string;
  maintenanceHistory: MaintenanceRecord[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  notes: string;
  createdAt: string;
}

export interface DamageEntry {
  type: string;
  notes: string;
  photos: string[]; // Base64 strings
}

export interface Booking {
  id: string;
  vehicleIds: string[];
  customerId: string;
  startDate: string;
  endDate: string;
  fromLocation: string;
  toLocation: string;
  status: BookingStatus;
  totalAmount: number;
  depositAmount: number;
  paymentStatus: PaymentStatus;
  damageNotes: string;
  damages?: DamageEntry[];
  notes: string;
  startMileage?: number;
  startFuelLevel?: string;
  endMileage?: number;
  endFuelLevel?: string;
  contractSignedDate?: string;
}
