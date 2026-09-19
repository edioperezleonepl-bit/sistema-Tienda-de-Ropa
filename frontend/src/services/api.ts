import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adjuntar token si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fs_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'ADMIN' | 'BRANCH_MANAGER' | 'CASHIER' | 'CLIENT' | 'SUPPLIER';
  branchId?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string;
  fittingRoomsCount: number;
  openTime: string;
  closeTime: string;
  city?: { id: string; name: string };
}

export interface ProductVariant {
  id: string;
  productId: string;
  product?: any;
  size: string;
  colorName: string;
  colorHex: string;
  sku: string;
  priceAdjustment: number;
  branchStock?: number;
  branchReserved?: number;
  inventories?: {
    branchId: string;
    branchName: string;
    stockQuantity: number;
    reservedQuantity: number;
  }[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  basePrice: number;
  imagesJson?: string;
  arOverlayImageUrl?: string;
  arModel3dUrl?: string;
  arAnchorType?: 'TORSO' | 'LEGS' | 'FULL_BODY' | 'HEAD';
  isFeatured: boolean;
  category?: { id: string; name: string };
  season?: { id: string; name: string };
  collection?: { id: string; name: string };
  variants: ProductVariant[];
}

export interface ReservationItem {
  id?: string;
  variantId: string;
  quantity: number;
  isPrepared?: boolean;
  variant?: ProductVariant;
}

export interface Reservation {
  id: string;
  reservationCode: string;
  reservationDate: string;
  timeSlot: string;
  status: 'PENDING' | 'PREPARED' | 'IN_FITTING_ROOM' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  assignedFittingRoom?: number;
  branch?: Branch;
  client?: User;
  items: ReservationItem[];
  createdAt: string;
}
