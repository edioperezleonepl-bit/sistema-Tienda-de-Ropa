import React, { useState, useEffect } from 'react';
import { CalendarCheck, MapPin, Clock, QrCode, AlertCircle, RefreshCw } from 'lucide-react';
import { api, Reservation } from '../services/api.js';

export const MyReservationsView: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMyReservations();
  }, []);

  const loadMyReservations = async () => {
    setLoading(true);
    try {
      let token = localStorage.getItem('fs_token');
      if (!token) {
        const resLogin = await api.post('/auth/login', {
          email: 'cliente@fashionstore.com',
          password: '123456',
        });
        token = resLogin.data.token;
        if (token) localStorage.setItem('fs_token', token);
      }
      const res = await api.get('/reservations/my');
      setReservations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (id: string) => {
    if (!confirm('¿Deseas cancelar esta reserva? Las prendas serán liberadas al inventario general.')) return;
    try {
      await api.patch(`/reservations/${id}/status`, { status: 'CANCELLED' });
      loadMyReservations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '20px auto', padding: '0 20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingBottom: 14,
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarCheck color="var(--accent-gold)" /> Mis Citas y Reservas en Vestidor
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Presenta tu código al llegar a la sucursal para ingresar a tu probador exclusivo
          </span>
        </div>

        <button onClick={loadMyReservations} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {reservations.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Aún no tienes citas agendadas. Explora nuestro catálogo y reserva tus prendas para probártelas en tienda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reservations.map((res) => (
            <div key={res.id} className="glass-card" style={{ padding: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: 12,
                marginBottom: 14,
                flexWrap: 'wrap',
                gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="badge badge-gold" style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                    {res.reservationCode}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                    {res.branch?.name} ({res.branch?.city?.name})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge ${
                    res.status === 'PENDING'
                      ? 'badge-warning'
                      : res.status === 'PREPARED'
                      ? 'badge-gold'
                      : res.status === 'IN_FITTING_ROOM'
                      ? 'badge-success'
                      : 'badge-secondary'
                  }`}>
                    {res.status === 'PENDING' && 'Pendiente de Preparación'}
                    {res.status === 'PREPARED' && '¡Prendas Listas en Perchero!'}
                    {res.status === 'IN_FITTING_ROOM' && 'En Probador'}
                    {res.status === 'COMPLETED' && 'Atención Completada'}
                    {res.status === 'CANCELLED' && 'Cancelada'}
                  </span>
                  {res.assignedFittingRoom && (
                    <span className="badge badge-success">
                      Vestidor #{res.assignedFittingRoom}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
                {/* Reserved Clothes List */}
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Prendas apartadas para tu prueba:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {res.items?.map((it) => (
                      <div
                        key={it.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 12px',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div style={{ flexGrow: 1, fontSize: '0.85rem' }}>
                          <strong>{it.variant?.product?.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Talla: {it.variant?.size} | Color: {it.variant?.colorName}
                          </div>
                        </div>
                        {it.isPrepared && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-success)', fontWeight: 700 }}>
                            Colgada en Perchero ✓
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* QR Voucher Card */}
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <div style={{ background: '#fff', padding: 4, borderRadius: 6 }}>
                    <QrCode size={48} color="#000" />
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    <div>Horario: <strong>{res.reservationDate}</strong></div>
                    <div>Turno: <strong>{res.timeSlot}</strong></div>
                    <div style={{ marginTop: 4, color: 'var(--accent-gold)' }}>
                      Muestra este pase al ingresar a la tienda
                    </div>
                  </div>
                </div>
              </div>

              {res.status === 'PENDING' && (
                <div style={{ marginTop: 14, textAlign: 'right' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#ef4444' }}
                    onClick={() => cancelReservation(res.id)}
                  >
                    Cancelar Cita
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
