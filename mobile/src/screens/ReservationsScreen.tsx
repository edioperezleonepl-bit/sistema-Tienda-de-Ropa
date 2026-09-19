import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Calendar, Clock, MapPin, QrCode, RefreshCw } from 'lucide-react-native';
import { API_BASE_URL } from '../services/api';

export const ReservationsScreen: React.FC = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    try {
      // Login demo cliente
      const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'cliente@fashionstore.com', password: '123456' }),
      });
      const loginData = await loginRes.json();

      const res = await fetch(`${API_BASE_URL}/reservations/my`, {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });
      const data = await res.json();
      setReservations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Citas en Vestidor</Text>
        <TouchableOpacity onPress={loadReservations} style={styles.btnRefresh}>
          <RefreshCw size={16} color="#d4af37" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#d4af37" style={{ marginTop: 40 }} />
      ) : reservations.length === 0 ? (
        <View style={styles.emptyBox}>
          <Calendar size={40} color="#64748b" />
          <Text style={styles.emptyText}>No tienes citas agendadas actualmente.</Text>
          <Text style={styles.emptySubtext}>
            Explora el catálogo y reserva prendas para probártelas en tu sucursal favorita.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          renderItem={({ item }) => (
            <View style={styles.resCard}>
              <View style={styles.cardTop}>
                <Text style={styles.codeText}>{item.reservationCode}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MapPin size={14} color="#d4af37" />
                <Text style={styles.branchName}>{item.branch?.name}</Text>
              </View>

              <View style={styles.infoRow}>
                <Clock size={14} color="#94a3b8" />
                <Text style={styles.slotText}>
                  {item.reservationDate} ({item.timeSlot})
                </Text>
              </View>

              {/* Clothes items preview */}
              <View style={styles.itemsPreview}>
                <Text style={styles.itemsTitle}>Prendas reservadas:</Text>
                {item.items?.map((it: any) => (
                  <Text key={it.id} style={styles.itemDetail}>
                    • {it.variant?.product?.name || 'Prenda'} ({it.variant?.size} - {it.variant?.colorName})
                  </Text>
                ))}
              </View>

              {/* QR Voucher preview */}
              <View style={styles.voucherBox}>
                <QrCode size={36} color="#d4af37" />
                <Text style={styles.voucherText}>
                  Muestra tu código al llegar a la tienda para ingresar al vestidor.
                </Text>
              </View>
            </View>
          )}
        />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  btnRefresh: {
    padding: 6,
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  resCard: {
    backgroundColor: '#161d2f',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeText: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: '800',
  },
  statusBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: '#f3e7be',
    fontSize: 11,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  branchName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  slotText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  itemsPreview: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  itemsTitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 12,
    color: '#e2e8f0',
    marginVertical: 1,
  },
  voucherBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  voucherText: {
    flex: 1,
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 15,
  },
});
