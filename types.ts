
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

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  brand: string;
  category: string;
  status: VehicleStatus;
  dailyRate: number;
  maintenanceNotes: string;
  image: string;
  currentMileage: number;
  color: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
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
}
