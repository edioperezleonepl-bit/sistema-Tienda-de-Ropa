import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  Calendar,
  Sparkles,
  DollarSign,
  Building,
  Layers,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { api } from '../services/api.js';
import { CreateProductModal } from './CreateProductModal.js';

export const AdminDashboardView: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [consolidatedStock, setConsolidatedStock] = useState<any[]>([]);
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const resLogin = await api.post('/auth/login', {
        email: 'admin@fashionstore.com',
        password: '123456',
      });
      localStorage.setItem('fs_token', resLogin.data.token);

      const [resOrders, resStock] = await Promise.all([
        api.get('/orders/all'),
        api.get('/inventory/consolidated'),
      ]);

      setOrders(resOrders.data);
      setConsolidatedStock(resStock.data);
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    }
  };

  const generateAiReport = async () => {
    setLoadingAi(true);
    try {
      const res = await api.get('/ai/reports/generative');
      setAiReport(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalUnitsInStock = consolidatedStock.reduce((sum, item) => sum + Number(item.stockQuantity || 0), 0);

  return (
    <div style={{ maxWidth: 1400, margin: '20px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp color="var(--accent-gold)" /> Panel de Control Administrativo
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Supervisión integral de ventas, inventario multinivel y análisis inteligente Moda Shopping
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn btn-primary"
            style={{
              background: 'var(--accent-gold-gradient)',
              color: '#0b0f19',
              fontWeight: 700,
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>+ Nueva Prenda</span>
          </button>

          <button
            onClick={generateAiReport}
            className="btn btn-secondary"
            disabled={loadingAi}
          >
            <Sparkles size={16} />
            {loadingAi ? 'Generando Reporte IA...' : 'Generar Análisis Ejecutivo con IA'}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(212, 175, 55, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-gold)',
          }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingresos Totales</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>${totalRevenue.toFixed(2)} USD</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60a5fa',
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Órdenes Registradas</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{orders.length} ventas</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-success)',
          }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Existencias Globales</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{totalUnitsInStock} prendas</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24',
          }}>
            <Building size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sucursales Conectadas</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>3 activas</div>
          </div>
        </div>
      </div>

      {/* AI Generative Report Section (RF25) */}
      {aiReport && (
        <div className="glass-card" style={{
          padding: '24px',
          border: '1px solid var(--accent-gold)',
          background: 'radial-gradient(circle at top right, rgba(212, 175, 55, 0.15) 0%, rgba(22, 29, 47, 0.95) 70%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Sparkles color="var(--accent-gold)" size={22} />
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Reporte Generativo con Inteligencia Artificial</h3>
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-line', color: '#e2e8f0' }}>
            {aiReport.generativeAnalysis}
          </p>
        </div>
      )}

      {/* Global Consolidated Inventory Table (RF21, RF24) */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} color="var(--accent-gold)" /> Inventario Consolidado de Todas las Sucursales
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px' }}>Sucursal</th>
                <th style={{ padding: '12px' }}>Prenda</th>
                <th style={{ padding: '12px' }}>Categoría</th>
                <th style={{ padding: '12px' }}>Talla / Color</th>
                <th style={{ padding: '12px' }}>Disponibles</th>
                <th style={{ padding: '12px' }}>En Reserva</th>
              </tr>
            </thead>
            <tbody>
              {consolidatedStock.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--accent-gold)' }}>
                    {item.branch?.name}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{item.variant?.product?.name}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                    {item.variant?.product?.category?.name || 'General'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {item.variant?.size} — {item.variant?.colorName}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 700, color: item.stockQuantity <= 3 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                    {item.stockQuantity} unid.
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                    {item.reservedQuantity} unid.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal para Crear Prenda */}
      <CreateProductModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          loadDashboardData();
        }}
      />
    </div>
  );
};
