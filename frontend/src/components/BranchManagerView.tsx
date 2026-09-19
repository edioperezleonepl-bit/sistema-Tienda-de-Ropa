import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Shirt,
  User,
  AlertCircle,
  Layers,
  ArrowUpDown,
  PlusCircle,
} from 'lucide-react';
import { Branch, api, Reservation } from '../services/api.js';

interface BranchManagerViewProps {
  selectedBranch: Branch | null;
}

export const BranchManagerView: React.FC<BranchManagerViewProps> = ({ selectedBranch }) => {
  const [activeTab, setActiveTab] = useState<'reservations' | 'stock'>('reservations');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [branchStock, setBranchStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (selectedBranch) {
      loadReservations();
      loadStock();
    }
  }, [selectedBranch, statusFilter]);

  const loadReservations = async () => {
    if (!selectedBranch) return;
    setLoading(true);
    try {
      // Autologuear como encargado
      const resLogin = await api.post('/auth/login', {
        email: 'encargado@fashionstore.com',
        password: '123456',
      });
      localStorage.setItem('fs_token', resLogin.data.token);

      const res = await api.get(`/reservations/branch/${selectedBranch.id}`, {
        params: statusFilter ? { status: statusFilter } : {},
      });
      setReservations(res.data);
    } catch (err) {
      console.error('Error al cargar reservas de sucursal:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStock = async () => {
    if (!selectedBranch) return;
    try {
      const res = await api.get(`/inventory/branch/${selectedBranch.id}`);
      setBranchStock(res.data);
    } catch (err) {
      console.error('Error al cargar stock:', err);
    }
  };

  const updateReservationStatus = async (
    reservationId: string,
    status: string,
    roomNumber?: number,
  ) => {
    try {
      await api.patch(`/reservations/${reservationId}/status`, {
        status,
        fittingRoomNumber: roomNumber,
      });
      loadReservations();
      loadStock();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el estado de la reserva');
    }
  };

  const toggleItemPrepared = async (itemId: string, currentState: boolean) => {
    try {
      await api.patch(`/reservations/items/${itemId}/prepared`, {
        isPrepared: !currentState,
      });
      loadReservations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '20px auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 14,
        borderBottom: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarCheck color="var(--accent-gold)" /> Panel de Encargado de Sucursal
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Recepción y preparación de vestidores físicos — {selectedBranch?.name}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn btn-sm ${activeTab === 'reservations' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('reservations')}
          >
            <Clock size={15} /> Cola de Reservas ({reservations.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'stock' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('stock')}
          >
            <Layers size={15} /> Inventario en Sucursal
          </button>
        </div>
      </div>

      {activeTab === 'reservations' ? (
        <div>
          {/* Status filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filtrar por estado:</span>
            {['', 'PENDING', 'PREPARED', 'IN_FITTING_ROOM', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                {st === '' ? 'Todos' : st}
              </button>
            ))}
          </div>

          {/* Reservations List */}
          {reservations.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No hay reservas pendientes para esta sucursal con el filtro seleccionado.
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
                      <span className="badge badge-gold" style={{ fontSize: '0.85rem' }}>
                        {res.reservationCode}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                        Cliente: {res.client?.fullName || 'Cliente Registrado'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Fecha: <strong>{res.reservationDate}</strong> ({res.timeSlot})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`badge ${
                        res.status === 'PENDING'
                          ? 'badge-warning'
                          : res.status === 'PREPARED'
                          ? 'badge-gold'
                          : res.status === 'IN_FITTING_ROOM'
                          ? 'badge-success'
                          : 'badge-secondary'
                      }`}>
                        {res.status}
                      </span>
                      {res.assignedFittingRoom && (
                        <span className="badge badge-success">
                          Vestidor #{res.assignedFittingRoom}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Checklist of clothes for the fitting rack */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      Prendas a preparar en el perchero del vestidor:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                      {res.items?.map((it) => (
                        <div
                          key={it.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            background: it.isPrepared ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${it.isPrepared ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!it.isPrepared}
                            onChange={() => toggleItemPrepared(it.id!, !!it.isPrepared)}
                            style={{ cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--accent-success)' }}
                          />
                          <Shirt size={16} color={it.isPrepared ? 'var(--accent-success)' : 'var(--accent-gold)'} />
                          <div style={{ flexGrow: 1, fontSize: '0.82rem' }}>
                            <div style={{ fontWeight: 600, color: '#fff' }}>
                              {it.variant?.product?.name || 'Prenda'}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                              Talla: {it.variant?.size} | Color: {it.variant?.colorName}
                            </div>
                          </div>
                          {it.isPrepared && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-success)', fontWeight: 700 }}>
                              Colgada ✓
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operational workflow actions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 10,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {res.notes ? `Nota: "${res.notes}"` : 'Sin indicaciones especiales'}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {res.status === 'PENDING' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => updateReservationStatus(res.id, 'PREPARED', 1)}
                        >
                          <CheckCircle2 size={14} /> Marcar Prendas Preparadas
                        </button>
                      )}

                      {res.status === 'PREPARED' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => updateReservationStatus(res.id, 'IN_FITTING_ROOM', 1)}
                        >
                          <User size={14} /> Cliente Ingresó al Vestidor #1
                        </button>
                      )}

                      {res.status === 'IN_FITTING_ROOM' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'var(--accent-success)', color: 'var(--accent-success)' }}
                          onClick={() => updateReservationStatus(res.id, 'COMPLETED')}
                        >
                          <CheckCircle2 size={14} /> Finalizar Atención (Probador Libre)
                        </button>
                      )}

                      {res.status !== 'CANCELLED' && res.status !== 'COMPLETED' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#ef4444' }}
                          onClick={() => updateReservationStatus(res.id, 'CANCELLED')}
                        >
                          Cancelar Reserva
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Branch Stock View */
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: 14 }}>
            Control de Existencias en {selectedBranch?.name}
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '10px' }}>Prenda</th>
                <th style={{ padding: '10px' }}>SKU</th>
                <th style={{ padding: '10px' }}>Talla / Color</th>
                <th style={{ padding: '10px' }}>Disponible</th>
                <th style={{ padding: '10px' }}>En Reserva (Vestidor)</th>
                <th style={{ padding: '10px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {branchStock.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{inv.variant?.product?.name}</td>
                  <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{inv.variant?.sku}</td>
                  <td style={{ padding: '10px' }}>
                    {inv.variant?.size} — {inv.variant?.colorName}
                  </td>
                  <td style={{ padding: '10px', fontWeight: 700, color: inv.stockQuantity <= 3 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                    {inv.stockQuantity} unidades
                  </td>
                  <td style={{ padding: '10px', color: 'var(--accent-gold)' }}>
                    {inv.reservedQuantity} apartadas
                  </td>
                  <td style={{ padding: '10px' }}>
                    {inv.stockQuantity <= 3 ? (
                      <span className="badge badge-danger">Stock Bajo</span>
                    ) : (
                      <span className="badge badge-success">Óptimo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
