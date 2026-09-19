import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, CheckCircle2, QrCode, AlertCircle } from 'lucide-react';
import { Product, ProductVariant, Branch, api } from '../services/api.js';

interface ReservationModalProps {
  initialProduct?: Product;
  initialVariant?: ProductVariant;
  branches: Branch[];
  selectedBranch: Branch | null;
  onClose: () => void;
  onSuccess: (res: any) => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  initialProduct,
  initialVariant,
  branches,
  selectedBranch,
  onClose,
  onSuccess,
}) => {
  const [branchId, setBranchId] = useState(selectedBranch?.id || branches[0]?.id || '');
  const [reservationDate, setReservationDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('15:00 - 15:45');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<any | null>(null);

  const availableSlots = [
    '10:00 - 10:45',
    '11:00 - 11:45',
    '12:00 - 12:45',
    '15:00 - 15:45',
    '16:00 - 16:45',
    '17:00 - 17:45',
    '18:00 - 18:45',
    '19:00 - 19:45',
  ];

  const handleConfirmReservation = async () => {
    if (!initialVariant) {
      setError('No hay ninguna prenda seleccionada para reservar.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Usar token de cliente demo si no está logueado
      const clientToken = localStorage.getItem('fs_token');
      if (!clientToken) {
        // Autologuear con usuario demo cliente
        const resLogin = await api.post('/auth/login', {
          email: 'cliente@fashionstore.com',
          password: '123456',
        });
        localStorage.setItem('fs_token', resLogin.data.token);
        localStorage.setItem('fs_user', JSON.stringify(resLogin.data.user));
      }

      const res = await api.post('/reservations', {
        branchId,
        reservationDate,
        timeSlot,
        notes,
        items: [
          {
            variantId: initialVariant.id,
            quantity: 1,
          },
        ],
      });

      setConfirmedReservation(res.data);
      onSuccess(res.data);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          'Error al registrar la reserva. Verifique que haya stock disponible en la sucursal seleccionada.',
      );
    } finally {
      setLoading(false);
    }
  };

  const branchObj = branches.find((b) => b.id === branchId);

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: 620, padding: '28px' }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            color: '#fff',
            width: 32,
            height: 32,
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {!confirmedReservation ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--accent-gold-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0b0f19',
              }}>
                <Calendar size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Reservar Vestidor Físico</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Preparamos tus prendas en el perchero de la sucursal para que solo llegues a probártelas
                </p>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#fca5a5',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Prenda seleccionada preview */}
            {initialProduct && initialVariant && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                marginBottom: 18,
              }}>
                <img
                  src={
                    initialProduct.imagesJson
                      ? JSON.parse(initialProduct.imagesJson)[0]
                      : ''
                  }
                  alt={initialProduct.name}
                  style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover' }}
                />
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                    {initialProduct.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: 10, marginTop: 2 }}>
                    <span>Talla: <strong>{initialVariant.size}</strong></span>
                    <span>Color: <strong>{initialVariant.colorName}</strong></span>
                  </div>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                  ${Number(initialProduct.basePrice) + Number(initialVariant.priceAdjustment || 0)}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="form-group">
              <label className="form-label">
                <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                Sucursal donde te probarás las prendas:
              </label>
              <select
                className="form-select"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {b.address}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Fecha de visita:
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={reservationDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setReservationDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Clock size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Horario de atención:
                </label>
                <select
                  className="form-select"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                >
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Indicaciones especiales (opcional):</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Ej. Llevaré calzado alto para probarme el largo del vestido..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmReservation}
                disabled={loading}
              >
                {loading ? 'Confirmando...' : 'Confirmar Reserva en Sucursal'}
              </button>
            </div>
          </div>
        ) : (
          /* Confirmation Success Voucher View */
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}>
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ fontSize: '1.4rem', margin: '0 0 6px 0' }}>¡Reserva Confirmada con Éxito!</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              El encargado de la sucursal ha sido notificado y preparará tus prendas antes de tu llegada.
            </p>

            {/* Voucher Card */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px dashed var(--accent-gold)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CÓDIGO DE RESERVA:</span>
                <span className="badge badge-gold" style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                  {confirmedReservation.reservationCode}
                </span>
              </div>

              <div style={{ height: 1, background: 'var(--border-color)' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Sucursal:</span>
                  <strong>{branchObj?.name || 'Sucursal Principal'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Horario Asignado:</span>
                  <strong>{confirmedReservation.reservationDate} ({confirmedReservation.timeSlot})</strong>
                </div>
              </div>

              <div style={{
                background: 'rgba(0,0,0,0.4)',
                padding: '12px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}>
                <div style={{ background: '#fff', padding: 6, borderRadius: 6 }}>
                  <QrCode size={48} color="#000" />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Muestra este código QR o tu carnet de identidad al llegar a la recepción de la sucursal.
                </div>
              </div>
            </div>

            <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
              Entendido, Continuar Navegando
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
