import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Trash2, CreditCard, QrCode, CheckCircle, ShoppingBag } from 'lucide-react-native';
import { Product, ProductVariant, API_BASE_URL } from '../services/api';

export interface MobileCartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

interface CartScreenProps {
  items: MobileCartItem[];
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onExplore: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  items,
  onRemoveItem,
  onClearCart,
  onExplore,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'QR'>('CARD');
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any | null>(null);

  const subtotal = items.reduce((sum, item) => {
    const p = Number(item.product.basePrice) + Number(item.variant.priceAdjustment || 0);
    return sum + p * item.quantity;
  }, 0);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      // Login demo cliente
      const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'cliente@fashionstore.com', password: '123456' }),
      });
      const loginData = await loginRes.json();

      // Transacción
      const simRes = await fetch(`${API_BASE_URL}/orders/payments/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: paymentMethod, amount: subtotal }),
      });
      const simData = await simRes.json();

      // Orden digital móvil
      const orderRes = await fetch(`${API_BASE_URL}/orders/checkout/digital`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginData.token}`,
        },
        body: JSON.stringify({
          deliveryAddress: 'Envío Móvil Express',
          paymentMethod,
          paymentTransactionId: simData.transactionId,
          items: items.map((it) => ({
            variantId: it.variant.id,
            quantity: it.quantity,
          })),
        }),
      });

      const orderData = await orderRes.json();
      setOrderComplete(orderData);
      onClearCart();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', 'No se pudo procesar la compra.');
    } finally {
      setLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <CheckCircle size={56} color="#10b981" />
        <Text style={styles.successTitle}>¡Compra Exitosa!</Text>
        <Text style={styles.successSub}>
          Comprobante Móvil: {orderComplete.orderNumber}
        </Text>
        <Text style={{ color: '#d4af37', fontSize: 18, fontWeight: '800', marginVertical: 12 }}>
          Total: ${orderComplete.total} USD
        </Text>
        <TouchableOpacity
          style={styles.btnGold}
          onPress={() => {
            setOrderComplete(null);
            onExplore();
          }}
        >
          <Text style={styles.btnGoldText}>Volver a la Tienda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bolsa de Compras Móvil</Text>
        <Text style={{ color: '#d4af37', fontWeight: '700' }}>{items.length} prendas</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <ShoppingBag size={48} color="#64748b" />
          <Text style={styles.emptyText}>Tu bolsa de compras está vacía.</Text>
          <TouchableOpacity style={styles.btnGold} onPress={onExplore}>
            <Text style={styles.btnGoldText}>Explorar Prendas</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={items}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item, index }) => {
              const images = item.product.imagesJson ? JSON.parse(item.product.imagesJson) : [];
              const price = Number(item.product.basePrice) + Number(item.variant.priceAdjustment || 0);
              return (
                <View style={styles.cartCard}>
                  <Image source={{ uri: images[0] }} style={styles.itemImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.product.name}</Text>
                    <Text style={styles.itemMeta}>
                      Talla: {item.variant.size} | {item.variant.colorName}
                    </Text>
                    <Text style={styles.itemPrice}>
                      ${price} x {item.quantity} = ${price * item.quantity} USD
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => onRemoveItem(index)} style={{ padding: 6 }}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              );
            }}
          />

          {/* Payment Method Selector */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionLabel}>Forma de Pago Digital:</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginVertical: 8 }}>
              <TouchableOpacity
                style={[styles.payBtn, paymentMethod === 'CARD' && styles.payBtnActive]}
                onPress={() => setPaymentMethod('CARD')}
              >
                <CreditCard size={14} color={paymentMethod === 'CARD' ? '#0b0f19' : '#fff'} />
                <Text style={[styles.payBtnText, paymentMethod === 'CARD' && styles.payBtnTextActive]}>
                  Tarjeta
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payBtn, paymentMethod === 'QR' && styles.payBtnActive]}
                onPress={() => setPaymentMethod('QR')}
              >
                <QrCode size={14} color={paymentMethod === 'QR' ? '#0b0f19' : '#fff'} />
                <Text style={[styles.payBtnText, paymentMethod === 'QR' && styles.payBtnTextActive]}>
                  QR Simple
                </Text>
              </TouchableOpacity>
            </View>

            {/* Total and Checkout */}
            <View style={styles.totalRow}>
              <Text style={{ color: '#94a3b8', fontSize: 14 }}>Total:</Text>
              <Text style={styles.totalAmount}>${subtotal.toFixed(2)} USD</Text>
            </View>

            <TouchableOpacity style={styles.btnCheckout} onPress={handleCheckout} disabled={loading}>
              <Text style={styles.btnCheckoutText}>
                {loading ? 'Procesando Pago...' : `Pagar $${subtotal.toFixed(2)} USD`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  cartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161d2f',
    borderRadius: 10,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  itemName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  itemMeta: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  itemPrice: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  paymentSection: {
    padding: 16,
    backgroundColor: '#131b2e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  sectionLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    borderRadius: 6,
  },
  payBtnActive: {
    backgroundColor: '#d4af37',
  },
  payBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  payBtnTextActive: {
    color: '#0b0f19',
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  totalAmount: {
    color: '#d4af37',
    fontSize: 18,
    fontWeight: '800',
  },
  btnCheckout: {
    backgroundColor: '#d4af37',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnCheckoutText: {
    color: '#0b0f19',
    fontWeight: '800',
    fontSize: 14,
  },
  successTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 14,
  },
  successSub: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  btnGold: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  btnGoldText: {
    color: '#0b0f19',
    fontWeight: '700',
  },
});
