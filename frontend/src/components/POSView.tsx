import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Receipt,
  User,
  Trash2,
  DollarSign,
  QrCode,
  CreditCard,
  Printer,
  CheckCircle,
} from 'lucide-react';
import { Product, ProductVariant, Branch, api } from '../services/api.js';

interface POSViewProps {
  branches: Branch[];
  selectedBranch: Branch | null;
}

interface PosItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export const POSView: React.FC<POSViewProps> = ({ branches, selectedBranch }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<PosItem[]>([]);
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [customerNit, setCustomerNit] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR' | 'CARD'>('CASH');
  const [cashGiven, setCashGiven] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any | null>(null);

  useEffect(() => {
    loadProducts();
  }, [selectedBranch]);

  const loadProducts = async () => {
    try {
      const res = await api.get('/catalog/products', {
        params: { branchId: selectedBranch?.id },
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Error al cargar catálogo para POS:', err);
    }
  };

  const addToCart = (product: Product, variant: ProductVariant) => {
    setCart((prev) => {
      const index = prev.findIndex((item) => item.variant.id === variant.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index].quantity += 1;
        return updated;
      }
      return [...prev, { product, variant, quantity: 1 }];
    });
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((item) => item.variant.id !== variantId));
  };

  const subtotal = cart.reduce((acc, item) => {
    const price = Number(item.product.basePrice) + Number(item.variant.priceAdjustment || 0);
    return acc + price * item.quantity;
  }, 0);

  const tax = subtotal * 0.13; // 13% IVA
  const total = subtotal; // Total general

  const cashChange = parseFloat(cashGiven) ? Math.max(0, parseFloat(cashGiven) - total) : 0;

  const handleCheckoutPOS = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      // Autologuear como cajero si no tiene sesión de cajero
      const resLogin = await api.post('/auth/login', {
        email: 'cajero@fashionstore.com',
        password: '123456',
      });
      localStorage.setItem('fs_token', resLogin.data.token);

      const res = await api.post('/orders/pos/presential', {
        customerName,
        customerNitOrCi: customerNit,
        paymentMethod: paymentMethod,
        items: cart.map((item) => ({
          variantId: item.variant.id,
          quantity: item.quantity,
        })),
      });

      setLastReceipt(res.data);
      setCart([]);
      setCashGiven('');
      loadProducts(); // Refrescar stock actualizado
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error al procesar venta en caja');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div style={{ maxWidth: 1400, margin: '20px auto', padding: '0 20px' }}>
      {/* Title bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 14,
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Receipt color="var(--accent-gold)" /> Punto de Venta en Caja (POS)
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Caja Registradora Presencial — {selectedBranch?.name || 'Sucursal Principal'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-success">● Caja Operativa</span>
          <span className="badge badge-gold">Cajero: Marcos Fernandez</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 24 }}>
        {/* Left Side: Product Search & Quick Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-color)',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
          }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar prenda por nombre o código SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.9rem',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>

          {/* Product Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14,
            maxHeight: 600,
            overflowY: 'auto',
            paddingRight: 6,
          }}>
            {filtered.map((prod) => {
              const images = prod.imagesJson ? JSON.parse(prod.imagesJson) : [];
              return (
                <div
                  key={prod.id}
                  className="glass-card"
                  style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  <img
                    src={images[0]}
                    alt={prod.name}
                    style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 6 }}
                  />
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{prod.sku}</span>
                    <h4 style={{ fontSize: '0.88rem', margin: '2px 0', color: '#fff' }}>{prod.name}</h4>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                      ${prod.basePrice} USD
                    </div>
                  </div>

                  {/* Add variant buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 'auto' }}>
                    {prod.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => addToCart(prod, v)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        title={`Stock en sucursal: ${v.branchStock ?? 'N/D'}`}
                      >
                        {v.size} - {v.colorName} (+{v.branchStock ?? 0})
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Cash Register Cart & Billing */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={18} color="var(--accent-gold)" /> Orden de Venta en Caja
          </h3>

          {/* Customer info for invoice */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 10,
          }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Razón Social / Cliente:</label>
              <input
                type="text"
                className="form-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">NIT / CI:</label>
              <input
                type="text"
                className="form-input"
                value={customerNit}
                onChange={(e) => setCustomerNit(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          {/* Cart item table */}
          <div style={{
            flexGrow: 1,
            maxHeight: 220,
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
          }}>
            {cart.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Escanee o seleccione prendas para registrar en caja
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '8px' }}>Prenda</th>
                    <th style={{ padding: '8px' }}>Cant</th>
                    <th style={{ padding: '8px' }}>Subtotal</th>
                    <th style={{ padding: '8px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => {
                    const price = Number(item.product.basePrice) + Number(item.variant.priceAdjustment || 0);
                    return (
                      <tr key={item.variant.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '8px' }}>
                          <div>{item.product.name}</div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {item.variant.size} - {item.variant.colorName}
                          </span>
                        </td>
                        <td style={{ padding: '8px', fontWeight: 700 }}>{item.quantity}</td>
                        <td style={{ padding: '8px', fontWeight: 700, color: 'var(--accent-gold)' }}>
                          ${(price * item.quantity).toFixed(2)}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          <button
                            onClick={() => removeFromCart(item.variant.id)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="form-label">Forma de Pago:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              <button
                type="button"
                className={`btn btn-sm ${paymentMethod === 'CASH' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPaymentMethod('CASH')}
              >
                <DollarSign size={14} /> Efectivo
              </button>
              <button
                type="button"
                className={`btn btn-sm ${paymentMethod === 'QR' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPaymentMethod('QR')}
              >
                <QrCode size={14} /> QR
              </button>
              <button
                type="button"
                className={`btn btn-sm ${paymentMethod === 'CARD' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPaymentMethod('CARD')}
              >
                <CreditCard size={14} /> Tarjeta
              </button>
            </div>
          </div>

          {paymentMethod === 'CASH' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Efectivo Recibido ($):</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Cambio a Entregar ($):</label>
                <div style={{
                  padding: '7px 10px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 800,
                  color: 'var(--accent-success)',
                  fontSize: '0.9rem',
                }}>
                  ${cashChange.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Total display & submit button */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
              <span>Total a Cobrar:</span>
              <span className="gold-gradient-text">${total.toFixed(2)} USD</span>
            </div>

            <button
              className="btn btn-primary btn-lg"
              disabled={cart.length === 0 || isSubmitting}
              onClick={handleCheckoutPOS}
              style={{ width: '100%' }}
            >
              <Printer size={18} /> {isSubmitting ? 'Facturando...' : 'Cobrar e Imprimir Comprobante'}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {lastReceipt && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 440, padding: '24px', background: '#fff', color: '#111' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #ccc', paddingBottom: 12, marginBottom: 12 }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: '#000' }}>FASHIONSTORE S.A.</h2>
              <div style={{ fontSize: '0.75rem', color: '#555' }}>SUCURSAL: {selectedBranch?.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#555' }}>{selectedBranch?.address}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: 6, color: '#000' }}>
                COMPROBANTE ELECTRÓNICO: {lastReceipt.orderNumber}
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', marginBottom: 10 }}>
              <div><strong>Cliente:</strong> {lastReceipt.customerName}</div>
              <div><strong>NIT/CI:</strong> {lastReceipt.customerNitOrCi}</div>
              <div><strong>Fecha:</strong> {new Date(lastReceipt.createdAt).toLocaleString()}</div>
            </div>

            <div style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '8px 0', fontSize: '0.8rem' }}>
              {lastReceipt.items?.map((it: any) => (
                <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>{it.quantity}x {it.variant?.product?.name || 'Prenda'}</span>
                  <span>${it.subtotal}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, marginTop: 10 }}>
              <span>TOTAL PAGADO:</span>
              <span>${lastReceipt.total} USD</span>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                className="btn btn-primary"
                onClick={() => setLastReceipt(null)}
                style={{ width: '100%' }}
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
