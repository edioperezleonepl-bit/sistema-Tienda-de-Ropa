import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Sparkles, Camera, RefreshCw, Calendar, ShoppingBag, X } from 'lucide-react-native';
import { Product, ProductVariant } from '../services/api';

interface ARFittingScreenProps {
  product?: Product;
  variant?: ProductVariant;
  onClose: () => void;
  onReserve: (p: Product, v: ProductVariant) => void;
  onAddToCart: (p: Product, v: ProductVariant) => void;
}

const { width, height } = Dimensions.get('window');

export const ARFittingScreen: React.FC<ARFittingScreenProps> = ({
  product,
  variant,
  onClose,
  onReserve,
  onAddToCart,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [scale, setScale] = useState(1.0);
  const [selectedSize, setSelectedSize] = useState(variant?.size || 'M');

  const images = product?.imagesJson ? JSON.parse(product.imagesJson) : [];
  const overlayUrl = product?.arOverlayImageUrl || images[0];

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionBox]}>
        <Sparkles size={36} color="#d4af37" />
        <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
        <Text style={styles.permissionDesc}>
          Para utilizar el probador virtual con Realidad Aumentada sobre tu cuerpo, FashionStore necesita acceso a la cámara.
        </Text>
        <TouchableOpacity style={styles.btnGold} onPress={requestPermission}>
          <Text style={styles.btnGoldText}>Permitir Cámara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
          <Text style={{ color: '#94a3b8' }}>Volver al Catálogo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSizeSelect = (sz: string) => {
    setSelectedSize(sz);
    if (sz === 'XS') setScale(0.85);
    else if (sz === 'S') setScale(0.92);
    else if (sz === 'M') setScale(1.0);
    else if (sz === 'L') setScale(1.08);
    else if (sz === 'XL') setScale(1.15);
  };

  return (
    <View style={styles.container}>
      {/* Live Camera Feed */}
      <CameraView style={StyleSheet.absoluteFill} facing={facing}>
        {/* AR HUD Targeting overlay */}
        <View style={styles.hudContainer}>
          <View style={styles.hudTop}>
            <View style={styles.badgeAR}>
              <Text style={styles.badgeARText}>● AR TRACKING ACTIVO</Text>
            </View>
            <TouchableOpacity style={styles.closeCircle} onPress={onClose}>
              <X size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Guidelines silhouette */}
          <View style={styles.silhouetteGuideline}>
            <View style={styles.headMarker} />
            <View style={styles.shoulderLine} />
          </View>

          {/* Real-time Projected AR Garment */}
          {overlayUrl && (
            <View
              style={[
                styles.garmentWrapper,
                { transform: [{ scale: scale }] },
              ]}
            >
              <Image
                source={{ uri: overlayUrl }}
                style={styles.garmentImage}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Bottom Floating Control Panel */}
          <View style={styles.bottomControls}>
            <View style={styles.productInfoRow}>
              <View>
                <Text style={styles.productNameText}>{product?.name || 'Prenda AR'}</Text>
                <Text style={styles.priceGold}>${product?.basePrice} USD</Text>
              </View>

              {/* Camera Switch */}
              <TouchableOpacity
                style={styles.btnFlip}
                onPress={() => setFacing((prev) => (prev === 'front' ? 'back' : 'front'))}
              >
                <RefreshCw size={16} color="#d4af37" />
              </TouchableOpacity>
            </View>

            {/* Size Selector */}
            <View style={styles.sizesRow}>
              {['XS', 'S', 'M', 'L', 'XL'].map((sz) => (
                <TouchableOpacity
                  key={sz}
                  style={[styles.sizeBtn, selectedSize === sz && styles.sizeBtnActive]}
                  onPress={() => handleSizeSelect(sz)}
                >
                  <Text style={[styles.sizeBtnText, selectedSize === sz && styles.sizeBtnTextActive]}>
                    {sz}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions: Reserve & Buy */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.btnReserve}
                onPress={() => product && variant && onReserve(product, variant)}
              >
                <Calendar size={16} color="#d4af37" />
                <Text style={styles.btnReserveText}>Reservar en Tienda</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnBuy}
                onPress={() => product && variant && onAddToCart(product, variant)}
              >
                <ShoppingBag size={16} color="#0b0f19" />
                <Text style={styles.btnBuyText}>Comprar Ahora</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionBox: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  permissionDesc: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 14,
    lineHeight: 18,
  },
  btnGold: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnGoldText: {
    color: '#0b0f19',
    fontWeight: '700',
    fontSize: 14,
  },
  btnCancel: {
    marginTop: 14,
  },
  hudContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  hudTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeAR: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  badgeARText: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '700',
  },
  closeCircle: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  silhouetteGuideline: {
    alignSelf: 'center',
    alignItems: 'center',
    opacity: 0.4,
  },
  headMarker: {
    width: 60,
    height: 75,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  shoulderLine: {
    width: 180,
    height: 1,
    backgroundColor: '#d4af37',
    marginTop: 20,
  },
  garmentWrapper: {
    position: 'absolute',
    top: '32%',
    left: '10%',
    width: '80%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  garmentImage: {
    width: '100%',
    height: '100%',
  },
  bottomControls: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  productInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productNameText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  priceGold: {
    color: '#d4af37',
    fontSize: 16,
    fontWeight: '800',
  },
  btnFlip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 8,
    borderRadius: 8,
  },
  sizesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  sizeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  sizeBtnActive: {
    backgroundColor: '#d4af37',
  },
  sizeBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  sizeBtnTextActive: {
    color: '#0b0f19',
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnReserve: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnReserveText: {
    color: '#d4af37',
    fontWeight: '700',
    fontSize: 12,
  },
  btnBuy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#d4af37',
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnBuyText: {
    color: '#0b0f19',
    fontWeight: '700',
    fontSize: 12,
  },
});
