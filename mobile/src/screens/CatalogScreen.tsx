import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Sparkles, Eye, Calendar, ShoppingBag, Search, Store } from 'lucide-react-native';
import { Product, ProductVariant, Branch, API_BASE_URL, resolveImageUrl } from '../services/api';

interface CatalogScreenProps {
  selectedBranch: Branch | null;
  onOpenAR: (product: Product, variant: ProductVariant) => void;
  onOpenReservation: (product: Product, variant: ProductVariant) => void;
  onAddToCart: (product: Product, variant: ProductVariant) => void;
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  selectedBranch,
  onOpenAR,
  onOpenReservation,
  onAddToCart,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    loadCatalog();
  }, [selectedBranch, selectedCategory]);

  const loadCatalog = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const url = `${API_BASE_URL}/catalog/products?${selectedBranch ? `branchId=${selectedBranch.id}` : ''}${selectedCategory ? `&categoryId=${selectedCategory}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);

      const catRes = await fetch(`${API_BASE_URL}/catalog/categories`);
      if (catRes.ok) {
        const cats = await catRes.json();
        setCategories(Array.isArray(cats) ? cats : []);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error de conexión con el backend');
    } finally {
      setLoading(false);
    }
  };

  const filtered = (products || []).filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.branchBar}>
        <Store size={14} color="#d4af37" />
        <Text style={styles.branchText} numberOfLines={1}>
          Sucursal: {selectedBranch?.name || 'Equipetrol Norte'}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Search size={16} color="#94a3b8" />
        <TextInput
          placeholder="Buscar vestido, blazer, jean..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* Categories Horizontal Slider */}
      <View style={{ height: 44, marginVertical: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <TouchableOpacity
            style={[styles.catPill, selectedCategory === '' && styles.catPillActive]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={[styles.catPillText, selectedCategory === '' && styles.catPillTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catPill, selectedCategory === c.id && styles.catPillActive]}
              onPress={() => setSelectedCategory(c.id)}
            >
              <Text style={[styles.catPillText, selectedCategory === c.id && styles.catPillTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#d4af37" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 50, paddingHorizontal: 24 }}>
          <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
            {errorMsg ? `No se pudo conectar al backend:\n${errorMsg}` : 'No se encontraron prendas disponibles.'}
          </Text>
          <TouchableOpacity
            onPress={loadCatalog}
            style={{ backgroundColor: '#d4af37', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 8 }}
          >
            <Text style={{ color: '#0b0f19', fontWeight: 'bold' }}>Reintentar Conexión</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          renderItem={({ item }) => {
            const images = item.imagesJson ? JSON.parse(item.imagesJson) : [];
            const firstVariant = item.variants?.[0];
            const stock = firstVariant?.branchStock ?? 6;

            return (
              <View style={styles.card}>
                <Image source={{ uri: resolveImageUrl(images[0]) }} style={styles.cardImage} />

                <View style={styles.cardBody}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.skuText}>{item.sku}</Text>
                    <View style={styles.stockBadge}>
                      <Text style={styles.stockBadgeText}>● {stock} disp.</Text>
                    </View>
                  </View>

                  <Text style={styles.productTitle}>{item.name}</Text>
                  <Text style={styles.priceText}>${item.basePrice} USD</Text>

                  {/* Action Buttons */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.btnAR}
                      onPress={() => firstVariant && onOpenAR(item, firstVariant)}
                    >
                      <Eye size={14} color="#0b0f19" />
                      <Text style={styles.btnARText}>Probar AR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnReserve}
                      onPress={() => firstVariant && onOpenReservation(item, firstVariant)}
                    >
                      <Calendar size={14} color="#d4af37" />
                      <Text style={styles.btnReserveText}>Reservar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnCart}
                      onPress={() => firstVariant && onAddToCart(item, firstVariant)}
                    >
                      <ShoppingBag size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
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
  branchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  branchText: {
    fontSize: 12,
    color: '#d4af37',
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161d2f',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#161d2f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
  },
  catPillActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  catPillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  catPillTextActive: {
    color: '#0b0f19',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#161d2f',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardImage: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  cardBody: {
    padding: 14,
  },
  skuText: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  stockBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stockBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
  },
  productTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  priceText: {
    color: '#d4af37',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  btnAR: {
    flex: 1,
    backgroundColor: '#d4af37',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  btnARText: {
    color: '#0b0f19',
    fontSize: 12,
    fontWeight: '700',
  },
  btnReserve: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  btnReserveText: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: '700',
  },
  btnCart: {
    backgroundColor: '#3b82f6',
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
