import React, { useState } from 'react';
import {
  X,
  Trash2,
  CreditCard,
  QrCode,
  Truck,
  Store,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, ProductVariant, Branch, api } from '../services/api.js';

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQty: (index: number, qty: number) => void;
  onClearCart: () => void;
  selectedBranch: Branch | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onUpdateQty,
  onClearCart,
  selectedBranch,
}) => {
  const [deliveryType, setDeliveryType] = useState<'PICKUP' | 'SHIPPING'>('PICKUP');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'QR' | 'TRANSFER'>('CARD');
  const [deliveryAddress, setDeliveryAddress] = useState('Av. San Martín #450, Santa Cruz');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState<any | null>(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => {
    const price = Number(item.product.basePrice) + Number(item.variant.priceAdjustment || 0);
    return acc + price * item.quantity;
  }, 0);

  const shippingCost = deliveryType === 'SHIPPING' ? 5.0 : 0.0;
  const total = subtotal + shippingCost;

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      // Autologuear con usuario demo cliente si no tiene token
      let token = localStorage.getItem('fs_token');
      if (!token) {
        const resLogin = await api.post('/auth/login', {
          email: 'cliente@fashionstore.com',
          password: '123456',
        });
        token = resLogin.data.token;
        if (token) localStorage.setItem('fs_token', token);
      }

      // Simular transacción en pasarela digital
      const sim = await api.post('/orders/payments/simulate', {
        method: paymentMethod,
        amount: total,
      });

      // Crear orden digital y descontar automáticamente del inventario (RF20)
      const resOrder = await api.post('/orders/checkout/digital', {
        branchId: selectedBranch?.id,
        deliveryAddress: deliveryType === 'SHIPPING' ? deliveryAddress : `Retiro en tienda: ${selectedBranch?.name}`,
        paymentMethod: paymentMethod,
        paymentTransactionId: sim.data.transactionId,
        items: cartItems.map((item) => ({
          variantId: item.variant.id,
          quantity: item.quantity,
        })),
      });

      setOrderCompleted(resOrder.data);
      onClearCart();

      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Error al procesar la compra:', err);
      alert(err.response?.data?.message || 'Error al completar la orden digital.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-content"
        style={{
          maxWidth: 580,
          display: 'flex',
          flexDirection: 'column',
          height: '92vh',
          padding: 0,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.95)',
        }}>
          <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Bolsa de Compras</span>
            <span className="badge badge-gold">{cartItems.length} prendas</span>
          </h3>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '6px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {!orderCompleted ? (
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', margin: 'auto 0', color: 'var(--text-muted)' }}>
                <p>Tu bolsa de compras está vacía.</p>
                <button className="btn btn-primary btn-sm" onClick={onClose} style={{ marginTop: 10 }}>
                  Explorar Prendas
                </button>
              </div>
            ) : (
              <>
                {/* List of Cart Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {cartItems.map((item, index) => {
                    const price = Number(item.product.basePrice) + Number(item.variant.priceAdjustment || 0);
                    const images = item.product.imagesJson ? JSON.parse(item.product.imagesJson) : [];
                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          background: 'rgba(255, 255, 255, 0.03)',
                          padding: '12px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <img
                          src={images[0]}
                          alt={item.product.name}
                          style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }}
                        />
                        <div style={{ flexGrow: 1 }}>
                          <h4 style={{ fontSize: '0.9rem', margin: 0, color: '#fff' }}>
                            {item.product.name}
                          </h4>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: 8, marginTop: 2 }}>
                            <span>Talla: <strong>{item.variant.size}</strong></span>
                            <span>Color: <strong>{item.variant.colorName}</strong></span>
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-gold)', marginTop: 4 }}>
                            ${price} USD
                          </div>
                        </div>

                        {/* Quantity Controller */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => onUpdateQty(index, Math.max(1, item.quantity - 1))}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 8px' }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQty(index, item.quantity + 1)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 8px' }}
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(index)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 6 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Delivery Options */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 10 }}>
                    Método de Entrega:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('PICKUP')}
                      className={`btn btn-sm ${deliveryType === 'PICKUP' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '10px' }}
                    >
                      <Store size={15} /> Retiro en Sucursal (Gratis)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('SHIPPING')}
                      className={`btn btn-sm ${deliveryType === 'SHIPPING' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '10px' }}
                    >
                      <Truck size={15} /> Envío Express ($5 USD)
                    </button>
                  </div>

                  {deliveryType === 'SHIPPING' && (
                    <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                      <label className="form-label">Dirección de Entrega:</label>
                      <input
                        type="text"
                        className="form-input"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 10 }}>
                    Pasarela de Pago Electrónica:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`btn btn-sm ${paymentMethod === 'CARD' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      <CreditCard size={15} /> Tarjeta
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('QR')}
                      className={`btn btn-sm ${paymentMethod === 'QR' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      <QrCode size={15} /> QR Simple
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('TRANSFER')}
                      className={`btn btn-sm ${paymentMethod === 'TRANSFER' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      Transferencia
                    </button>
                  </div>

                  {/* QR Preview if QR selected */}
                  {paymentMethod === 'QR' && (
                    <div style={{
                      marginTop: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: 'rgba(0,0,0,0.3)',
                      padding: 10,
                      borderRadius: 6,
                    }}>
                      <div style={{ background: '#fff', padding: 4, borderRadius: 4 }}>
                        <QrCode size={40} color="#000" />
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Se debitará automáticamente mediante el QR interbancario seguro al presionar Pagar.
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Order Confirmation View */
          <div style={{ flexGrow: 1, padding: '30px', textAlign: 'center', overflowY: 'auto' }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}>
              <CheckCircle size={36} />
            </div>

            <h3 style={{ fontSize: '1.4rem', margin: '0 0 6px 0' }}>¡Pago Aprobado y Orden Creada!</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
              El inventario de la sucursal ha sido actualizado automáticamente.
            </p>

            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid var(--accent-gold)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              fontSize: '0.85rem',
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Número de Comprobante:</span>
                <strong className="gold-gradient-text">{orderCompleted.orderNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Monto Total:</span>
                <strong style={{ fontSize: '1.1rem' }}>${orderCompleted.total} USD</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Método de Pago:</span>
                <span>{orderCompleted.paymentMethod}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>ID de Transacción:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{orderCompleted.paymentTransactionId}</span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => {
                setOrderCompleted(null);
                onClose();
              }}
              style={{ width: '100%' }}
            >
              Cerrar y Volver a la Tienda
            </button>
          </div>
        )}

        {/* Footer with Totals and Pay Button */}
        {!orderCompleted && cartItems.length > 0 && (
          <div style={{
            padding: '18px 24px',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)} USD</span>
            </div>
            {deliveryType === 'SHIPPING' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Envío:</span>
                <span>$5.00 USD</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800 }}>
              <span>Total a Pagar:</span>
              <span className="gold-gradient-text">${total.toFixed(2)} USD</span>
            </div>

            <button
              className="btn btn-primary btn-lg"
              disabled={isProcessing}
              onClick={handleCheckout}
              style={{ width: '100%' }}
            >
              {isProcessing ? 'Procesando Transacción Segura...' : `Pagar $${total.toFixed(2)} USD`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
