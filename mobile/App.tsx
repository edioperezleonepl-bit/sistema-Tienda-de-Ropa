import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  ShoppingBag,
  Eye,
  Calendar,
  Sparkles,
  Store,
  ChevronRight,
} from 'lucide-react-native';

import { CatalogScreen } from './src/screens/CatalogScreen';
import { ARFittingScreen } from './src/screens/ARFittingScreen';
import { ReservationsScreen } from './src/screens/ReservationsScreen';
import { CartScreen, MobileCartItem } from './src/screens/CartScreen';
import { AIScreen } from './src/screens/AIScreen';
import { Product, ProductVariant, Branch, API_BASE_URL } from './src/services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'catalog' | 'ar' | 'reservations' | 'cart' | 'ai'>('catalog');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Cart
  const [cartItems, setCartItems] = useState<MobileCartItem[]>([]);

  // AR Modal State
  const [activeAR, setActiveAR] = useState<{ product: Product; variant: ProductVariant } | null>(null);

  // Reservation Modal State
  const [reservationModal, setReservationModal] = useState<{ product: Product; variant: ProductVariant } | null>(null);
  const [resDate, setResDate] = useState('2026-09-25');
  const [resSlot, setResSlot] = useState('16:00 - 16:45');
  const [resLoading, setResLoading] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/branches`);
      const data = await res.json();
      setBranches(data);
      if (data.length > 0) setSelectedBranch(data[0]);
    } catch (err) {
      console.error('Error al cargar sucursales:', err);
    }
  };

  const handleAddToCart = (product: Product, variant: ProductVariant) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((it) => it.variant.id === variant.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { product, variant, quantity: 1 }];
    });
    Alert.alert('Agregado', `${product.name} (${variant.size}) agregado a la bolsa.`);
  };

  const handleCreateReservation = async () => {
    if (!reservationModal || !selectedBranch) return;
    setResLoading(true);
    try {
      // Login cliente
      const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'cliente@fashionstore.com', password: '123456' }),
      });
      const loginData = await loginRes.json();

      const res = await fetch(`${API_BASE_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginData.token}`,
        },
        body: JSON.stringify({
          branchId: selectedBranch.id,
          reservationDate: resDate,
          timeSlot: resSlot,
          items: [{ variantId: reservationModal.variant.id, quantity: 1 }],
        }),
      });
      const data = await res.json();
      setReservationModal(null);
      Alert.alert(
        '¡Reserva Creada!',
        `Código de Reserva: ${data.reservationCode}\nSucursal: ${selectedBranch.name}`,
      );
      setCurrentTab('reservations');
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo crear la reserva en la sucursal.');
    } finally {
      setResLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.logoBadge}>
            <Sparkles size={16} color="#0b0f19" />
          </View>
          <Text style={styles.brandTitle}>
            FASHION<Text style={{ color: '#d4af37' }}>STORE</Text>
          </Text>
        </View>

        {/* Branch switcher */}
        <TouchableOpacity
          style={styles.branchPill}
          onPress={() => {
            if (branches.length > 1) {
              const curIdx = branches.findIndex((b) => b.id === selectedBranch?.id);
              const nextIdx = (curIdx + 1) % branches.length;
              setSelectedBranch(branches[nextIdx]);
            }
          }}
        >
          <Store size={12} color="#d4af37" />
          <Text style={styles.branchPillText} numberOfLines={1}>
            {selectedBranch?.city?.name || 'Santa Cruz'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screen Body */}
      <View style={{ flex: 1 }}>
        {currentTab === 'catalog' && (
          <CatalogScreen
            selectedBranch={selectedBranch}
            onOpenAR={(p, v) => setActiveAR({ product: p, variant: v })}
            onOpenReservation={(p, v) => setReservationModal({ product: p, variant: v })}
            onAddToCart={handleAddToCart}
          />
        )}

        {currentTab === 'ar' && (
          <ARFittingScreen
            product={activeAR?.product}
            variant={activeAR?.variant}
            onClose={() => setCurrentTab('catalog')}
            onReserve={(p, v) => setReservationModal({ product: p, variant: v })}
            onAddToCart={handleAddToCart}
          />
        )}

        {currentTab === 'reservations' && <ReservationsScreen />}

        {currentTab === 'cart' && (
          <CartScreen
            items={cartItems}
            onRemoveItem={(i) => setCartItems((prev) => prev.filter((_, idx) => idx !== i))}
            onClearCart={() => setCartItems([])}
            onExplore={() => setCurrentTab('catalog')}
          />
        )}

        {currentTab === 'ai' && (
          <AIScreen
            onOpenAR={(p, v) => {
              setActiveAR({ product: p, variant: v });
              setCurrentTab('ar');
            }}
          />
        )}
      </View>

      {/* AR Camera Modal from anywhere */}
      {activeAR && (
        <Modal visible animationType="slide">
          <ARFittingScreen
            product={activeAR.product}
            variant={activeAR.variant}
            onClose={() => setActiveAR(null)}
            onReserve={(p, v) => {
              setActiveAR(null);
              setReservationModal({ product: p, variant: v });
            }}
            onAddToCart={(p, v) => {
              setActiveAR(null);
              handleAddToCart(p, v);
            }}
          />
        </Modal>
      )}

      {/* Reservation Booking Modal in Mobile */}
      {reservationModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Reservar Vestidor Físico</Text>
              <Text style={styles.modalSubtitle}>
                {reservationModal.product.name} ({reservationModal.variant.size} - {reservationModal.variant.colorName})
              </Text>

              <Text style={styles.fieldLabel}>Sucursal Asignada:</Text>
              <Text style={styles.fieldValue}>{selectedBranch?.name}</Text>

              <Text style={styles.fieldLabel}>Fecha de Visita:</Text>
              <TextInput
                value={resDate}
                onChangeText={setResDate}
                style={styles.modalInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.fieldLabel}>Horario / Turno:</Text>
              <TextInput
                value={resSlot}
                onChangeText={setResSlot}
                style={styles.modalInput}
                placeholder="16:00 - 16:45"
                placeholderTextColor="#64748b"
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.btnModal, { backgroundColor: '#1e293b' }]}
                  onPress={() => setReservationModal(null)}
                >
                  <Text style={{ color: '#fff' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnModal, { backgroundColor: '#d4af37' }]}
                  onPress={handleCreateReservation}
                  disabled={resLoading}
                >
                  <Text style={{ color: '#0b0f19', fontWeight: '700' }}>
                    {resLoading ? 'Guardando...' : 'Confirmar Cita'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Bottom Tab Navigation Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('catalog')}
        >
          <ShoppingBag size={20} color={currentTab === 'catalog' ? '#d4af37' : '#64748b'} />
          <Text style={[styles.tabLabel, currentTab === 'catalog' && styles.tabLabelActive]}>
            Catálogo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('ar')}
        >
          <Eye size={20} color={currentTab === 'ar' ? '#d4af37' : '#64748b'} />
          <Text style={[styles.tabLabel, currentTab === 'ar' && styles.tabLabelActive]}>
            Vestidor AR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('reservations')}
        >
          <Calendar size={20} color={currentTab === 'reservations' ? '#d4af37' : '#64748b'} />
          <Text style={[styles.tabLabel, currentTab === 'reservations' && styles.tabLabelActive]}>
            Reservas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('cart')}
        >
          <View>
            <ShoppingBag size={20} color={currentTab === 'cart' ? '#d4af37' : '#64748b'} />
            {cartItems.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, currentTab === 'cart' && styles.tabLabelActive]}>
            Bolsa
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentTab('ai')}
        >
          <Sparkles size={20} color={currentTab === 'ai' ? '#d4af37' : '#64748b'} />
          <Text style={[styles.tabLabel, currentTab === 'ai' && styles.tabLabelActive]}>
            Asesor IA
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0b0f19',
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  branchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  branchPillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#d4af37',
    fontWeight: '700',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#131b2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#d4af37',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  fieldLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 8,
  },
  fieldValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  modalInput: {
    backgroundColor: '#0b0f19',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 13,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  btnModal: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
