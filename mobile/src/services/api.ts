import { Platform } from 'react-native';

// En emulador Android se usa 10.0.2.2, en iOS localhost o la IP de red local
export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api',
  ios: 'http://localhost:3000/api',
  default: 'http://localhost:3000/api',
});

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
