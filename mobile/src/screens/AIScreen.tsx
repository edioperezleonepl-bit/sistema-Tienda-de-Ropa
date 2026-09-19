import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Sparkles, Send, Eye } from 'lucide-react-native';
import { API_BASE_URL, Product, ProductVariant } from '../services/api';

interface AIScreenProps {
  onOpenAR: (p: Product, v: ProductVariant) => void;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  suggestedProducts?: Product[];
}

export const AIScreen: React.FC<AIScreenProps> = ({ onOpenAR }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: '¡Hola! Soy tu Asistente Personal de Moda con Inteligencia Artificial. ¿Qué estilo o prenda estás buscando hoy?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const newMsgs: ChatMessage[] = [...messages, { sender: 'user', text }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: data.message,
          suggestedProducts: data.suggestedProducts,
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: 'Disculpa, no pude procesar tu solicitud en este momento.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Vestido de noche para fiesta',
    'Chaqueta abrigada casual',
    'Camisa de algodón para oficina',
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Sparkles size={18} color="#d4af37" />
        <Text style={styles.title}>Asesor de Moda IA</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.msgBubble,
              item.sender === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text style={[styles.msgText, item.sender === 'user' ? styles.userText : styles.aiText]}>
              {item.text}
            </Text>

            {item.suggestedProducts && item.suggestedProducts.length > 0 && (
              <View style={styles.suggestionsBox}>
                {item.suggestedProducts.map((p) => {
                  const v = p.variants?.[0];
                  return (
                    <View key={p.id} style={styles.suggestionItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{p.name}</Text>
                        <Text style={{ color: '#d4af37', fontSize: 11 }}>${p.basePrice} USD</Text>
                      </View>
                      {v && (
                        <TouchableOpacity
                          style={styles.btnARMini}
                          onPress={() => onOpenAR(p, v)}
                        >
                          <Eye size={12} color="#0b0f19" />
                          <Text style={{ color: '#0b0f19', fontSize: 10, fontWeight: '700' }}>AR</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      />

      {loading && (
        <View style={{ padding: 10, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#d4af37" />
        </View>
      )}

      {/* Quick Prompts */}
      <View style={styles.promptsRow}>
        {quickPrompts.map((q, idx) => (
          <TouchableOpacity key={idx} style={styles.promptPill} onPress={() => sendMessage(q)}>
            <Text style={styles.promptText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input box */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Escribe tu consulta de moda..."
          placeholderTextColor="#64748b"
          value={input}
          onChangeText={setInput}
          style={styles.textInput}
        />
        <TouchableOpacity style={styles.btnSend} onPress={() => sendMessage()} disabled={loading}>
          <Send size={16} color="#0b0f19" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  msgBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#d4af37',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#161d2f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  userText: {
    color: '#0b0f19',
    fontWeight: '600',
  },
  aiText: {
    color: '#e2e8f0',
  },
  suggestionsBox: {
    marginTop: 8,
    gap: 6,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  btnARMini: {
    backgroundColor: '#d4af37',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  promptsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  promptPill: {
    backgroundColor: '#161d2f',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  promptText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#131b2e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0b0f19',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 13,
  },
  btnSend: {
    backgroundColor: '#d4af37',
    padding: 10,
    borderRadius: 8,
  },
});
