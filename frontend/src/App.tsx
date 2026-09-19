import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Glasses,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  CalendarCheck,
  RefreshCw,
} from 'lucide-react';
import { Navbar } from './components/Navbar.js';
import { ProductCard } from './components/ProductCard.js';
import { ARVirtualFittingModal } from './components/ARVirtualFittingModal.js';
import { ReservationModal } from './components/ReservationModal.js';
import { CartDrawer, CartItem } from './components/CartDrawer.js';
import { POSView } from './components/POSView.js';
import { BranchManagerView } from './components/BranchManagerView.js';
import { AdminDashboardView } from './components/AdminDashboardView.js';
import { AIAssistantWidget } from './components/AIAssistantWidget.js';
import { MyReservationsView } from './components/MyReservationsView.js';
import { Product, ProductVariant, Branch, api } from './services/api.js';

export function App() {
  const [currentTab, setCurrentTab] = useState('catalog');
  const [currentRole, setCurrentRole] = useState('CLIENT');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modals
  const [arModal, setArModal] = useState<{ product: Product; variant: ProductVariant } | null>(null);
  const [reservationModal, setReservationModal] = useState<{ product?: Product; variant?: ProductVariant } | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      loadProducts();
    }
  }, [selectedBranch, selectedCategory, searchQuery]);

  const loadInitialData = async () => {
    try {
      const [resBranches, resCats] = await Promise.all([
        api.get('/branches'),
        api.get('/catalog/categories'),
      ]);
      setBranches(resBranches.data);
      setCategories(resCats.data);

      if (resBranches.data.length > 0) {
        setSelectedBranch(resBranches.data[0]);
      }
    } catch (err) {
      console.error('Error al inicializar datos:', err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/catalog/products', {
        params: {
          branchId: selectedBranch?.id,
          categoryId: selectedCategory || undefined,
          search: searchQuery || undefined,
        },
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cart handlers
  const handleAddToCart = (product: Product, variant: ProductVariant) => {
    setCartItems((prev) => {
      const index = prev.findIndex((item) => item.variant.id === variant.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index].quantity += 1;
        return updated;
      }
      return [...prev, { product, variant, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCartQty = (index: number, qty: number) => {
    setCartItems((prev) => {
      const updated = [...prev];
      updated[index].quantity = qty;
      return updated;
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="bg-ambient-glow" />

      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        branches={branches}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        openCart={() => setIsCartOpen(true)}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        openAiAssistant={() => setIsAiOpen(true)}
      />

      {/* Main Content Areas */}
      <main style={{ flexGrow: 1 }}>
        {/* Tab 1: Store & Catalog */}
        {currentTab === 'catalog' && (
          <div>
            {/* Hero Luxury Fashion Banner */}
            <section style={{
              position: 'relative',
              padding: '60px 24px',
              textAlign: 'center',
              borderBottom: '1px solid var(--border-color)',
              background: 'radial-gradient(ellipse at 50% 20%, rgba(212, 175, 55, 0.12) 0%, transparent 70%)',
            }}>
              <div style={{ maxWidth: 880, margin: '0 auto' }}>
                <span className="badge badge-gold" style={{ marginBottom: 16 }}>
                  <Sparkles size={12} /> Nueva Colección 2026
                </span>
                <h1 style={{
                  fontSize: 'clamp(2rem, 5vw, 3.4rem)',
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  marginBottom: 16,
                  lineHeight: 1.15,
                }}>
                  Moda Inteligente con <span className="gold-gradient-text">Vestidor Virtual AR</span>
                </h1>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: 680, margin: '0 auto 28px auto' }}>
                  Pruébate las prendas en vivo con la cámara de tu dispositivo o reserva tu vestidor físico en la sucursal más cercana para una atención personalizada.
                </p>

                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => {
                      if (products.length > 0 && products[0].variants?.[0]) {
                        setArModal({ product: products[0], variant: products[0].variants[0] });
                      }
                    }}
                  >
                    <Glasses size={20} /> Probar Vestidor AR Ahora
                  </button>

                  <button
                    className="btn btn-secondary btn-lg"
                    onClick={() => setIsAiOpen(true)}
                  >
                    <Sparkles size={18} color="var(--accent-gold)" /> Consultar al Asesor IA
                  </button>
                </div>
              </div>
            </section>

            {/* Catalog Filter Controls */}
            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '30px 20px 10px 20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
                marginBottom: 24,
              }}>
                {/* Category Pills */}
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`btn btn-sm ${selectedCategory === '' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Todas las Prendas
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  padding: '8px 16px',
                  width: 320,
                  maxWidth: '100%',
                }}>
                  <Search size={16} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Buscar blazer, vestido, jean..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '0.85rem',
                      width: '100%',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Branch Notification Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                marginBottom: 24,
              }}>
                <div>
                  Mostrando inventario y disponibilidad en: <strong>{selectedBranch?.name}</strong> ({selectedBranch?.address})
                </div>
                <div style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
                  Horario: {selectedBranch?.openTime} - {selectedBranch?.closeTime} | {selectedBranch?.fittingRoomsCount} probadores
                </div>
              </div>

              {/* Product Grid */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <RefreshCw size={28} className="spin" style={{ marginBottom: 12 }} />
                  <div>Cargando prendas y disponibilidad en sucursal...</div>
                </div>
              ) : products.length === 0 ? (
                <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron prendas para los filtros seleccionados.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 24,
                  paddingBottom: 60,
                }}>
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      selectedBranch={selectedBranch}
                      onOpenAR={(prod, variant) => setArModal({ product: prod, variant })}
                      onOpenReservation={(prod, variant) => setReservationModal({ product: prod, variant })}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: AR Fitting Showcase */}
        {currentTab === 'ar-fitting' && (
          <div style={{ maxWidth: 1200, margin: '30px auto', padding: '0 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <span className="badge badge-gold">
                <Glasses size={14} /> Probador Inmersivo
              </span>
              <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', marginTop: 8 }}>
                Selecciona una Prenda para Proyectarla con Realidad Aumentada
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 600, margin: '8px auto 0 auto' }}>
                Utiliza la cámara en tiempo real para visualizar cómo te queda cada talla y color antes de comprar o reservar.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 20,
            }}>
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="glass-card"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (prod.variants?.[0]) {
                      setArModal({ product: prod, variant: prod.variants[0] });
                    }
                  }}
                >
                  <img
                    src={prod.imagesJson ? JSON.parse(prod.imagesJson)[0] : ''}
                    alt={prod.name}
                    style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }}
                  />
                  <h4 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 4px 0' }}>{prod.name}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                    Anclaje: {prod.arAnchorType || 'TORSO'}
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                    <Glasses size={15} /> Abrir Vestidor AR
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Client Reservations */}
        {currentTab === 'reservations' && <MyReservationsView />}

        {/* Tab 4: Cashier POS */}
        {currentTab === 'pos' && <POSView branches={branches} selectedBranch={selectedBranch} />}

        {/* Tab 5: Branch Manager */}
        {currentTab === 'manager' && <BranchManagerView selectedBranch={selectedBranch} />}

        {/* Tab 6: Admin Dashboard */}
        {currentTab === 'admin' && <AdminDashboardView />}
      </main>

      {/* AR Modal */}
      {arModal && (
        <ARVirtualFittingModal
          product={arModal.product}
          initialVariant={arModal.variant}
          selectedBranch={selectedBranch}
          onClose={() => setArModal(null)}
          onReserve={(prod, v) => setReservationModal({ product: prod, variant: v })}
          onBuy={(prod, v) => handleAddToCart(prod, v)}
        />
      )}

      {/* Reservation Modal */}
      {reservationModal && (
        <ReservationModal
          initialProduct={reservationModal.product}
          initialVariant={reservationModal.variant}
          branches={branches}
          selectedBranch={selectedBranch}
          onClose={() => setReservationModal(null)}
          onSuccess={() => {}}
        />
      )}

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveCartItem}
        onUpdateQty={handleUpdateCartQty}
        onClearCart={() => setCartItems([])}
        selectedBranch={selectedBranch}
      />

      {/* AI Stylist Assistant Floating Widget */}
      <AIAssistantWidget
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onOpenAR={(prod, v) => setArModal({ product: prod, variant: v })}
      />

      {/* Footer */}
      <footer style={{
        backgroundColor: '#070a12',
        borderTop: '1px solid var(--border-color)',
        padding: '30px 24px',
        textAlign: 'center',
        marginTop: 60,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            © 2026 <strong>FashionStore</strong> — Plataforma Inteligente con Realidad Aumentada e IA.
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Backend: <strong>NestJS + PostgreSQL</strong></span>
            <span>Web: <strong>React</strong></span>
            <span>Móvil: <strong>React Native</strong></span>
            <span>Cloud: <strong>Azure</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
