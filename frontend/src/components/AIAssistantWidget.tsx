import React, { useState } from 'react';
import { X, Send, Sparkles, Bot, Glasses, ArrowRight } from 'lucide-react';
import { api, Product, ProductVariant } from '../services/api.js';

interface AIAssistantWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAR: (product: Product, variant: ProductVariant) => void;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  suggestedProducts?: Product[];
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
  isOpen,
  onClose,
  onOpenAR,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: '¡Hola! Soy tu Asistente Personal de Moda con Inteligencia Artificial. ¿Qué tipo de outfit o combinación estás buscando hoy?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const userMsg = textToSend || input;
    if (!userMsg.trim()) return;

    const newMsgs: Message[] = [...messages, { sender: 'user', text: userMsg }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMsg });
      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: res.data.message,
          suggestedProducts: res.data.suggestedProducts,
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: 'Disculpa, ocurrió un inconveniente con el recomendador de IA. Te sugiero explorar nuestras colecciones destacadas.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Vestido elegante de gala para boda',
    'Chaqueta abrigada moderna para invierno',
    'Camisa fresca y casual de algodón',
    'Recomendación según mi talla',
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      width: 420,
      maxWidth: 'calc(100vw - 48px)',
      height: 600,
      maxHeight: 'calc(100vh - 100px)',
      background: '#111827',
      border: '1px solid rgba(212, 175, 55, 0.4)',
      borderRadius: 'var(--radius-md)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.6), var(--shadow-glow)',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'scaleUp 0.25s ease-out',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--accent-gold-gradient)',
            color: '#0b0f19',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>Fashion Stylist AI</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)' }}>Asesor de Estilo & Outfit</div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages area */}
      <div style={{
        flexGrow: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{
              padding: '10px 14px',
              borderRadius: 14,
              fontSize: '0.85rem',
              lineHeight: 1.45,
              background: m.sender === 'user' ? 'var(--accent-gold-gradient)' : 'rgba(255,255,255,0.06)',
              color: m.sender === 'user' ? '#0b0f19' : '#fff',
              fontWeight: m.sender === 'user' ? 600 : 400,
              border: m.sender === 'user' ? 'none' : '1px solid var(--border-color)',
            }}>
              {m.text}
            </div>

            {/* If AI recommended garments */}
            {m.suggestedProducts && m.suggestedProducts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {m.suggestedProducts.map((p) => {
                  const variant = p.variants?.[0];
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: 8,
                        border: '1px solid rgba(212, 175, 55, 0.25)',
                        fontSize: '0.78rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{p.name}</div>
                        <div style={{ color: 'var(--accent-gold)' }}>${p.basePrice} USD</div>
                      </div>
                      {variant && (
                        <button
                          className="btn btn-sm btn-outline-gold"
                          style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                          onClick={() => {
                            onClose();
                            onOpenAR(p, variant);
                          }}
                        >
                          <Glasses size={12} /> Probar en AR
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color="var(--accent-gold)" /> El asesor está diseñando combinaciones para ti...
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div style={{
        padding: '8px 12px',
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.7rem', padding: '4px 8px', whiteSpace: 'nowrap' }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        gap: 8,
        background: 'rgba(15, 23, 42, 0.95)',
      }}>
        <input
          type="text"
          placeholder="Pregúntale al estilista IA..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{
            flexGrow: 1,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
