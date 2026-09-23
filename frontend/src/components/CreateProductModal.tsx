import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Glasses,
  Image as ImageIcon,
  Tag,
  DollarSign,
  Layers,
  Check,
  Package,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, Product } from '../services/api.js';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: Product) => void;
}

const PRESET_GARMENTS = [
  { name: 'Chaqueta Biker', url: '/garments/biker_jacket.jpg', anchor: 'TORSO' },
  { name: 'Blazer Ejecutivo', url: '/garments/blazer.jpg', anchor: 'TORSO' },
  { name: 'Vestido de Gala', url: '/garments/evening_dress.jpg', anchor: 'FULL_BODY' },
  { name: 'Camisa Blanca', url: '/garments/white_shirt.jpg', anchor: 'TORSO' },
  { name: 'Polera Minimalista', url: '/garments/black_tshirt.jpg', anchor: 'TORSO' },
  { name: 'Pantalón Denim', url: '/garments/denim_pants.jpg', anchor: 'LEGS' },
];

const PRESET_COLORS = [
  { name: 'Negro Obsidian', hex: '#09090B' },
  { name: 'Blanco Puro', hex: '#FFFFFF' },
  { name: 'Azul Marino', hex: '#1E3A8A' },
  { name: 'Rojo Borgoña', hex: '#881337' },
  { name: 'Verde Esmeralda', hex: '#065F46' },
  { name: 'Café Coñac', hex: '#78350F' },
  { name: 'Beige Arena', hex: '#D4B996' },
  { name: 'Dorado Luxury', hex: '#D4AF37' },
];

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [basePrice, setBasePrice] = useState('120');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);

  // AR & Images
  const [imageUrl, setImageUrl] = useState('/garments/blazer.jpg');
  const [enableAr, setEnableAr] = useState(true);
  const [arAnchorType, setArAnchorType] = useState('TORSO');

  // Variants & Stock
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L']);
  const [selectedColors, setSelectedColors] = useState<typeof PRESET_COLORS>([
    PRESET_COLORS[0],
    PRESET_COLORS[1],
  ]);
  const [initialStockPerBranch, setInitialStockPerBranch] = useState('15');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCatalogMetadata();
      generateRandomSku();
    }
  }, [isOpen]);

  const generateRandomSku = () => {
    const letters = ['LUX', 'MOD', 'FSH', 'GLM', 'CRZ', 'STW'];
    const randLetters = letters[Math.floor(Math.random() * letters.length)];
    const randNum = Math.floor(100 + Math.random() * 900);
    setSku(`${randLetters}-${randNum}`);
  };

  const loadCatalogMetadata = async () => {
    try {
      const [resCats, resSeasons, resCols] = await Promise.all([
        api.get('/catalog/categories'),
        api.get('/catalog/seasons'),
        api.get('/catalog/collections'),
      ]);
      setCategories(resCats.data);
      setSeasons(resSeasons.data);
      setCollections(resCols.data);

      if (resCats.data.length > 0 && !categoryId) setCategoryId(resCats.data[0].id);
      if (resSeasons.data.length > 0 && !seasonId) setSeasonId(resSeasons.data[0].id);
      if (resCols.data.length > 0 && !collectionId) setCollectionId(resCols.data[0].id);
    } catch (err) {
      console.error('Error al cargar metadatos de catálogo:', err);
    }
  };

  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      if (selectedSizes.length > 1) {
        setSelectedSizes(selectedSizes.filter((s) => s !== size));
      }
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const toggleColor = (color: typeof PRESET_COLORS[0]) => {
    const exists = selectedColors.some((c) => c.name === color.name);
    if (exists) {
      if (selectedColors.length > 1) {
        setSelectedColors(selectedColors.filter((c) => c.name !== color.name));
      }
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Por favor ingrese el nombre de la prenda.');
      return;
    }
    if (!basePrice || Number(basePrice) <= 0) {
      setErrorMsg('El precio base debe ser mayor a cero.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Asegurar token de Admin
      let token = localStorage.getItem('fs_token');
      if (!token) {
        const resLogin = await api.post('/auth/login', {
          email: 'admin@fashionstore.com',
          password: '123456',
        });
        token = resLogin.data.token;
        if (token) localStorage.setItem('fs_token', token);
      }

      // Normalizar SKU reemplazando espacios por guiones
      const cleanSku = (sku.trim() || `PRENDA-${Date.now().toString().slice(-4)}`).replace(/\s+/g, '-').toUpperCase();

      // Generar combinaciones de variantes de talla y color
      const variants: any[] = [];
      for (const col of selectedColors) {
        for (const sz of selectedSizes) {
          variants.push({
            size: sz,
            colorName: col.name,
            colorHex: col.hex,
            sku: `${cleanSku}-${sz}-${col.name.slice(0, 3).toUpperCase().replace(/\s+/g, '')}`,
            priceAdjustment: 0,
          });
        }
      }

      const payload = {
        name: name.trim(),
        description: description.trim() || `Diseño exclusivo de temporada confeccionado con materiales de alta calidad y corte moderno.`,
        sku: cleanSku,
        basePrice: parseFloat(basePrice),
        categoryId: categoryId || undefined,
        seasonId: seasonId || undefined,
        collectionId: collectionId || undefined,
        imagesJson: JSON.stringify([imageUrl]),
        arOverlayImageUrl: enableAr ? imageUrl : undefined,
        arAnchorType: enableAr ? String(arAnchorType).toUpperCase() : undefined,
        isFeatured,
        initialStockPerBranch: parseInt(initialStockPerBranch || '10', 10),
        variants,
      };

      const res = await api.post('/catalog/products', payload);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      console.error('Error al crear producto:', err);
      setErrorMsg(
        err.response?.data?.message || 'Error al guardar el producto. Verifica la conexión con el backend.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '92vh',
          backgroundColor: '#0d1322',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(212, 175, 55, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.08) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'var(--accent-gold-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0b0f19',
              }}
            >
              <Package size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-serif)',
                  color: '#fff',
                  letterSpacing: '0.02em',
                }}
              >
                Crear Nueva Prenda de Catálogo
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Sube una nueva prenda a la tienda con soporte para Vestidor Virtual AR y stock inicial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-sm btn-secondary"
            style={{ padding: 8, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Content */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          {errorMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--accent-danger)',
                color: '#fca5a5',
                fontSize: '0.85rem',
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Section 1: Datos Básicos */}
          <div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--accent-gold)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Tag size={16} /> 1. Datos Principales de la Prenda
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Nombre de la Prenda *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Abrigo Velvet de Invierno"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Código SKU Base
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={generateRandomSku}
                    className="btn btn-sm btn-secondary"
                    title="Generar nuevo código"
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Precio Base (Bs.) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: 11, color: 'var(--accent-gold)', fontSize: '0.9rem', fontWeight: 700 }}>
                    Bs.
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 42px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Categoría
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#111827',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Temporada
                </label>
                <select
                  value={seasonId}
                  onChange={(e) => setSeasonId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#111827',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.year})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Colección
                </label>
                <select
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#111827',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                >
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Descripción de la Prenda
              </label>
              <textarea
                rows={2}
                placeholder="Detalla los materiales, textura, ocasión y corte..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Section 2: Imagen y Vestidor Virtual AR */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 18 }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--accent-gold)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Glasses size={16} /> 2. Imagen y Vestidor Virtual AR
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Preview Box */}
              <div
                style={{
                  width: 110,
                  height: 140,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '2px solid rgba(212, 175, 55, 0.4)',
                  backgroundColor: '#111827',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon size={30} color="var(--text-muted)" />
                )}
              </div>

              {/* URL input and Presets */}
              <div style={{ flex: 1, minWidth: 260 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  URL de Imagen (o selecciona una plantilla rápida)
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://... o /garments/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    marginBottom: 10,
                  }}
                />

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {PRESET_GARMENTS.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => {
                        setImageUrl(p.url);
                        setArAnchorType(p.anchor);
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: imageUrl === p.url ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                        background: imageUrl === p.url ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        color: imageUrl === p.url ? 'var(--accent-gold)' : 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={enableAr}
                      onChange={(e) => setEnableAr(e.target.checked)}
                      style={{ accentColor: 'var(--accent-gold)', width: 16, height: 16 }}
                    />
                    <span>Activar en Vestidor Virtual AR</span>
                  </label>

                  {enableAr && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Anclaje anatómico:</span>
                      <select
                        value={arAnchorType}
                        onChange={(e) => setArAnchorType(e.target.value)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: '#111827',
                          border: '1px solid var(--border-color)',
                          color: 'var(--accent-gold)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          outline: 'none',
                        }}
                      >
                        <option value="TORSO">Torso (Blazer / Polera / Camisa)</option>
                        <option value="LEGS">Piernas (Pantalón / Jeans / Falda)</option>
                        <option value="FULL_BODY">Cuerpo Completo (Vestido / Enterizo)</option>
                        <option value="HEAD">Cabeza (Sombreros / Lentes)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Tallas, Colores y Stock Inicial */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 18 }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--accent-gold)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Layers size={16} /> 3. Variantes de Talla, Colores y Stock Inicial
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* Tallas Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Tallas disponibles ({selectedSizes.length} seleccionadas)
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ALL_SIZES.map((sz) => {
                    const isSelected = selectedSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSize(sz)}
                        style={{
                          width: 42,
                          height: 38,
                          borderRadius: 8,
                          border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--accent-gold-gradient)' : 'rgba(255, 255, 255, 0.04)',
                          color: isSelected ? '#0b0f19' : 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                        }}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colores Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Colores disponibles ({selectedColors.length} seleccionados)
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map((col) => {
                    const isSelected = selectedColors.some((c) => c.name === col.name);
                    return (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => toggleColor(col)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          cursor: 'pointer',
                        }}
                      >
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            backgroundColor: col.hex,
                            border: '1px solid rgba(255,255,255,0.4)',
                            display: 'inline-block',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: isSelected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                            fontWeight: isSelected ? 700 : 500,
                          }}
                        >
                          {col.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stock inicial y destacado */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Stock inicial por sucursal para cada variante:
                </span>
                <input
                  type="number"
                  min="0"
                  value={initialStockPerBranch}
                  onChange={(e) => setInitialStockPerBranch(e.target.value)}
                  style={{
                    width: 70,
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>unidades</span>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  style={{ accentColor: 'var(--accent-gold)', width: 16, height: 16 }}
                />
                <span>Destacar en Portada</span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: 16,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
              }}
            >
              {loading ? (
                <>Guardando Prenda...</>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Publicar en Catálogo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
