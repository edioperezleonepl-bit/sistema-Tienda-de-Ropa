import React from 'react';
import {
  ShoppingBag,
  Sparkles,
  Glasses,
  CalendarCheck,
  ShieldCheck,
  Store,
  CreditCard,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import { Branch } from '../services/api.js';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  branches: Branch[];
  selectedBranch: Branch | null;
  setSelectedBranch: (b: Branch) => void;
  cartCount: number;
  openCart: () => void;
  currentRole: string;
  setCurrentRole: (role: string) => void;
  openAiAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  branches,
  selectedBranch,
  setSelectedBranch,
  cartCount,
  openCart,
  currentRole,
  setCurrentRole,
  openAiAssistant,
}) => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(11, 15, 25, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '12px 24px',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        flexWrap: 'wrap',
      }}>
        {/* Brand & Logo */}
        <div
          onClick={() => setCurrentTab('catalog')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'var(--accent-gold-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0b0f19',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <Sparkles size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              fontFamily: 'var(--font-serif)',
            }}>
              FASHION<span className="gold-gradient-text">STORE</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              AR & Smart Boutique
            </div>
          </div>
        </div>

        {/* Branch Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
        }}>
          <Store size={16} color="var(--accent-gold)" />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Sucursal:</span>
          <select
            value={selectedBranch?.id || ''}
            onChange={(e) => {
              const b = branches.find((item) => item.id === e.target.value);
              if (b) setSelectedBranch(b);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id} style={{ background: '#111827', color: '#fff' }}>
                {b.name} ({b.city?.name || 'Bolivia'})
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className={`btn btn-sm ${currentTab === 'catalog' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentTab('catalog')}
          >
            <ShoppingBag size={15} /> Catálogo
          </button>

          <button
            className={`btn btn-sm ${currentTab === 'ar-fitting' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentTab('ar-fitting')}
            style={{
              border: currentTab === 'ar-fitting' ? 'none' : '1px solid rgba(212, 175, 55, 0.4)',
              color: currentTab === 'ar-fitting' ? '#0b0f19' : 'var(--accent-gold)',
            }}
          >
            <Glasses size={15} /> Vestidor Virtual AR
          </button>

          <button
            className={`btn btn-sm ${currentTab === 'reservations' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentTab('reservations')}
          >
            <CalendarCheck size={15} /> Reservas
          </button>

          {/* Role specific views */}
          {(currentRole === 'CASHIER' || currentRole === 'ADMIN') && (
            <button
              className={`btn btn-sm ${currentTab === 'pos' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentTab('pos')}
            >
              <CreditCard size={15} /> Caja POS
            </button>
          )}

          {(currentRole === 'BRANCH_MANAGER' || currentRole === 'ADMIN') && (
            <button
              className={`btn btn-sm ${currentTab === 'manager' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentTab('manager')}
            >
              <UserCheck size={15} /> Encargado
            </button>
          )}

          {currentRole === 'ADMIN' && (
            <button
              className={`btn btn-sm ${currentTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentTab('admin')}
            >
              <ShieldCheck size={15} /> Admin Dashboard
            </button>
          )}
        </nav>

        {/* Right Actions: AI, Role Switcher, Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* AI Stylist button */}
          <button
            onClick={openAiAssistant}
            className="btn btn-sm btn-outline-gold"
            title="Asistente de Moda Inteligente"
            style={{ position: 'relative' }}
          >
            <Sparkles size={16} />
            <span>Asesor IA</span>
          </button>

          {/* Role switcher for evaluation testing */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rol:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-gold)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="CLIENT" style={{ background: '#111827', color: '#fff' }}>Cliente</option>
              <option value="CASHIER" style={{ background: '#111827', color: '#fff' }}>Cajero (POS)</option>
              <option value="BRANCH_MANAGER" style={{ background: '#111827', color: '#fff' }}>Encargado Sucursal</option>
              <option value="ADMIN" style={{ background: '#111827', color: '#fff' }}>Administrador</option>
            </select>
          </div>

          {/* Shopping Cart button */}
          <button
            onClick={openCart}
            className="btn btn-sm btn-primary"
            style={{ position: 'relative' }}
          >
            <ShoppingBag size={17} />
            <span>Carrito</span>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -6,
                right: -6,
                backgroundColor: 'var(--accent-danger)',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 800,
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
