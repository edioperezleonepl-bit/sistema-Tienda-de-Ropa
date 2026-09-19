import React, { useState } from 'react';
import { Sparkles, Glasses, CalendarCheck, ShoppingBag, Check } from 'lucide-react';
import { Product, ProductVariant, Branch } from '../services/api.js';

interface ProductCardProps {
  product: Product;
  selectedBranch: Branch | null;
  onOpenAR: (product: Product, variant: ProductVariant) => void;
  onOpenReservation: (product: Product, variant: ProductVariant) => void;
  onAddToCart: (product: Product, variant: ProductVariant) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  selectedBranch,
  onOpenAR,
  onOpenReservation,
  onAddToCart,
}) => {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const currentVariant = product.variants?.[selectedVariantIndex] || product.variants?.[0];

  const images = product.imagesJson ? JSON.parse(product.imagesJson) : [];
  const mainImage = images[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800';

  // Stock en sucursal seleccionada
  const branchStock = currentVariant?.branchStock !== undefined ? currentVariant.branchStock : 8;

  return (
    <div className="glass-card" style={{
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100%',
    }}>
      {/* Product Image & Badges */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '125%', overflow: 'hidden' }}>
        <img
          src={mainImage}
          alt={product.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />

        {/* Overlay Badges */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 2 }}>
          {product.isFeatured && (
            <span className="badge badge-gold">
              <Sparkles size={11} /> Destacado
            </span>
          )}
          {product.category && (
            <span className="badge" style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#fff', border: '1px solid var(--border-color)' }}>
              {product.category.name}
            </span>
          )}
        </div>

        {/* Quick AR Trigger floating badge */}
        <button
          onClick={() => currentVariant && onOpenAR(product, currentVariant)}
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            background: 'rgba(11, 15, 25, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(212, 175, 55, 0.5)',
            color: 'var(--accent-gold)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            transition: 'var(--transition)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-gold)';
            e.currentTarget.style.color = '#000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(11, 15, 25, 0.85)';
            e.currentTarget.style.color = 'var(--accent-gold)';
          }}
        >
          <Glasses size={15} /> Probar en AR
        </button>
      </div>

      {/* Info Body */}
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 12 }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {product.season?.name || 'Colección 2026'}
          </div>
          <h3 style={{ fontSize: '1.05rem', margin: '4px 0 6px 0', color: 'var(--text-primary)' }}>
            {product.name}
          </h3>
          <p style={{
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.4,
          }}>
            {product.description}
          </p>
        </div>

        {/* Color & Size Variant Selectors */}
        {product.variants && product.variants.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Color swatches */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Color:</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {product.variants.map((variant, index) => (
                  <button
                    key={variant.id}
                    title={`${variant.colorName} - Talla ${variant.size}`}
                    onClick={() => setSelectedVariantIndex(index)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: variant.colorHex || '#000',
                      border: selectedVariantIndex === index ? '2px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.2)',
                      boxShadow: selectedVariantIndex === index ? '0 0 8px var(--accent-gold)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selectedVariantIndex === index && (
                      <Check size={12} color={variant.colorHex === '#FFFFFF' ? '#000' : '#fff'} />
                    )}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {currentVariant?.colorName}
              </span>
            </div>

            {/* Size badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Talla:</span>
              <span className="badge badge-gold" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                {currentVariant?.size}
              </span>
            </div>
          </div>
        )}

        {/* Stock status in selected branch */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.78rem',
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Disponibilidad en sucursal:
          </span>
          {branchStock > 0 ? (
            <span style={{ color: 'var(--accent-success)', fontWeight: 700 }}>
              ● {branchStock} disponibles
            </span>
          ) : (
            <span style={{ color: 'var(--accent-danger)', fontWeight: 700 }}>
              ● Agotado en esta sucursal
            </span>
          )}
        </div>

        {/* Price & Action Buttons */}
        <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Precio unitario:</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ${Number(product.basePrice) + Number(currentVariant?.priceAdjustment || 0)}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>USD</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => currentVariant && onOpenReservation(product, currentVariant)}
              title="Reservar para probarte en el vestidor físico de la sucursal"
            >
              <CalendarCheck size={14} color="var(--accent-gold)" /> Reservar
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => currentVariant && onAddToCart(product, currentVariant)}
            >
              <ShoppingBag size={14} /> Al Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
