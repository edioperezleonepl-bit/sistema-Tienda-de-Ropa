import { Platform } from 'react-native';

// Dirección IP del backend en la nube
export const API_BASE_URL = 'http://135.222.42.88:3000/api';

export const resolveImageUrl = (path?: string) => {
  if (!path) return 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

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
