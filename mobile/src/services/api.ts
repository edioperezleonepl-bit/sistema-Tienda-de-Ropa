import { Platform } from 'react-native';

// IP de red local de tu PC para que el celular físico pueda conectarse al backend
const HOST_IP = '192.168.0.4';

export const API_BASE_URL = `http://${HOST_IP}:3000/api`;

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  colorName: string;
  colorHex: string;
  sku: string;
  priceAdjustment: number;
  branchStock?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  basePrice: number;
  imagesJson?: string;
  arOverlayImageUrl?: string;
  arAnchorType?: string;
  isFeatured: boolean;
  category?: { id: string; name: string };
  season?: { id: string; name: string };
  variants: ProductVariant[];
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
