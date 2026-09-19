import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  VideoOff,
  Sparkles,
  Sliders,
  CalendarCheck,
  ShoppingBag,
  RefreshCw,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { Product, ProductVariant, Branch } from '../services/api.js';

interface ARVirtualFittingModalProps {
  product: Product;
  initialVariant: ProductVariant;
  selectedBranch: Branch | null;
  onClose: () => void;
  onReserve: (product: Product, variant: ProductVariant) => void;
  onBuy: (product: Product, variant: ProductVariant) => void;
}

export const ARVirtualFittingModal: React.FC<ARVirtualFittingModalProps> = ({
  product,
  initialVariant,
  selectedBranch,
  onClose,
  onReserve,
  onBuy,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(initialVariant);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // AR adjustments
  const [scale, setScale] = useState(1.0);
  const [posY, setPosY] = useState(0); // Offset en px
  const [posX, setPosX] = useState(0);
  const [opacity, setOpacity] = useState(0.92);
  const [showHUD, setShowHUD] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const images = product.imagesJson ? JSON.parse(product.imagesJson) : [];
  const garmentImageUrl = product.arOverlayImageUrl || images[0] || '';

  // Iniciar o apagar la cámara
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setIsCameraActive(false);
    } else {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch (err: any) {
        console.error('Error al acceder a la cámara:', err);
        setCameraError('No se pudo activar la cámara web. Puedes continuar con el maniquí avatar interactivo.');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Ajuste de escala según talla
  const handleSizeChange = (v: ProductVariant) => {
    setSelectedVariant(v);
    if (v.size === 'XS') setScale(0.85);
    else if (v.size === 'S') setScale(0.92);
    else if (v.size === 'M') setScale(1.0);
    else if (v.size === 'L') setScale(1.08);
    else if (v.size === 'XL' || v.size === 'XXL') setScale(1.16);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: 880, padding: 0 }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.95)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--accent-gold-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0b0f19',
            }}>
              <Sparkles size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                Vestidor Virtual AR: <span className="gold-gradient-text">{product.name}</span>
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Realidad Aumentada & Ajuste Biométrico Virtual
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Main Body: AR Canvas and Control Sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', minHeight: 480 }}>
          {/* AR Viewport */}
          <div style={{
            position: 'relative',
            backgroundColor: '#090d16',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRight: '1px solid var(--border-color)',
          }}>
            {/* Live Video or Avatar Background */}
            {isCameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // Modo espejo natural
                }}
              />
            ) : (
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at center, #1e293b 0%, #0b0f19 100%)',
              }}>
                {/* Silhouette model avatar */}
                <div style={{
                  position: 'relative',
                  width: 280,
                  height: 420,
                  borderRadius: '140px 140px 60px 60px',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                  border: '1px dashed rgba(212, 175, 55, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingTop: 30,
                }}>
                  {/* Head outline */}
                  <div style={{
                    width: 70,
                    height: 90,
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.03)',
                  }} />
                  {/* Neck & Shoulders guideline */}
                  <div style={{
                    width: 220,
                    height: 2,
                    background: 'rgba(212, 175, 55, 0.4)',
                    marginTop: 35,
                  }} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-gold)', marginTop: 4 }}>
                    Línea Guía de Hombros
                  </span>
                </div>
              </div>
            )}

            {/* Scanning Laser Line Effect */}
            <div className="ar-scanline" />

            {/* AR Virtual Garment Overlay */}
            <div
              style={{
                position: 'absolute',
                top: `calc(50% + ${posY}px)`,
                left: `calc(50% + ${posX}px)`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                transition: 'transform 0.15s ease-out',
                pointerEvents: 'none',
                opacity: opacity,
                zIndex: 15,
                filter: selectedVariant.colorHex
                  ? `drop-shadow(0 8px 24px rgba(0,0,0,0.6))`
                  : 'none',
              }}
            >
              <img
                src={garmentImageUrl}
                alt={product.name}
                style={{
                  maxWidth: 320,
                  maxHeight: 380,
                  objectFit: 'contain',
                  filter: 'contrast(1.05) brightness(1.02)',
                }}
              />
            </div>

            {/* AR HUD overlay markers */}
            {showHUD && (
              <div style={{
                position: 'absolute',
                inset: 16,
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: 12,
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 12,
                zIndex: 20,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    fontSize: '0.68rem',
                    color: 'var(--accent-gold)',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '3px 8px',
                    borderRadius: 4,
                  }}>
                    ● AR TRACKING: ACTIVO ({product.arAnchorType || 'TORSO'})
                  </div>
                  <div style={{
                    fontSize: '0.68rem',
                    color: '#fff',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '3px 8px',
                    borderRadius: 4,
                  }}>
                    TALLA VIRTUAL: {selectedVariant.size}
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: 6 }}>
                  Alinea tu torso en el centro para una simulación precisa
                </div>
              </div>
            )}

            {/* Camera Switcher Button on Bottom Left */}
            <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 25 }}>
              <button
                onClick={toggleCamera}
                className={`btn btn-sm ${isCameraActive ? 'btn-secondary' : 'btn-primary'}`}
              >
                {isCameraActive ? <VideoOff size={15} /> : <Camera size={15} />}
                <span>{isCameraActive ? 'Usar Maniquí' : 'Activar Mi Cámara'}</span>
              </button>
            </div>
          </div>

          {/* Controls & Product Details Sidebar */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
            {cameraError && (
              <div style={{
                padding: '8px 12px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.76rem',
                color: '#fcd34d',
              }}>
                {cameraError}
              </div>
            )}

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Prenda Seleccionada
              </div>
              <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '4px 0' }}>
                {product.name}
              </h4>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                ${Number(product.basePrice) + Number(selectedVariant.priceAdjustment || 0)} USD
              </div>
            </div>

            {/* Variant Selector (Colors) */}
            <div>
              <label className="form-label">Color seleccionado: {selectedVariant.colorName}</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: v.colorHex || '#000',
                      border: selectedVariant.id === v.id ? '2px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.2)',
                      boxShadow: selectedVariant.id === v.id ? '0 0 10px var(--accent-gold)' : 'none',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Size Selector with Live Scale Adjustment */}
            <div>
              <label className="form-label">Talla para prueba virtual:</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSizeChange(v)}
                    className={`btn btn-sm ${selectedVariant.id === v.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 14px' }}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>

            {/* AR Adjustment Sliders */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sliders size={14} color="var(--accent-gold)" /> Calibración AR
                </span>
                <button
                  onClick={() => { setScale(1.0); setPosY(0); setPosX(0); setOpacity(0.92); }}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                >
                  <RefreshCw size={11} /> Reset
                </button>
              </div>

              {/* Escala */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Escala / Proporción:</span>
                  <span>{Math.round(scale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.5"
                  step="0.02"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  style={{ accentColor: 'var(--accent-gold)', width: '100%' }}
                />
              </div>

              {/* Altura Vertical */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ajuste Vertical:</span>
                  <span>{posY}px</span>
                </div>
                <input
                  type="range"
                  min="-120"
                  max="120"
                  step="2"
                  value={posY}
                  onChange={(e) => setPosY(parseInt(e.target.value))}
                  style={{ accentColor: 'var(--accent-gold)', width: '100%' }}
                />
              </div>

              {/* Opacidad de Prenda */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Opacidad:</span>
                  <span>{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  style={{ accentColor: 'var(--accent-gold)', width: '100%' }}
                />
              </div>
            </div>

            {/* Direct Conversion Actions */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  onReserve(product, selectedVariant);
                }}
              >
                <CalendarCheck size={16} /> Reservar para Probar en Tienda
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => {
                  onClose();
                  onBuy(product, selectedVariant);
                }}
              >
                <ShoppingBag size={16} /> Comprar Directamente Online
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
