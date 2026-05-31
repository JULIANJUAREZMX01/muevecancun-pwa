import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Mic, RotateCcw, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import TripPlanner from '@/components/agent/TripPlanner';

const QUICK_QUESTIONS = [
  '¿Cómo llego a la Zona Hotelera?',
  '¿Cuánto cuesta el pasaje?',
  '¿Qué ruta pasa por el aeropuerto?',
  '¿Cuáles son los horarios?',
  '¿Hay demoras hoy?',
];

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1"
          style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}
        >
          <span className="text-lg">🦜</span>
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        {message.content && (
          <div
            className="rounded-3xl px-4 py-3 text-sm leading-relaxed"
            style={{
              backgroundColor: isUser ? '#2D6A4F' : 'white',
              color: isUser ? 'white' : '#1F2937',
              boxShadow: isUser ? 'none' : '0 2px 12px rgba(45,106,79,0.1)',
              borderBottomRightRadius: isUser ? '6px' : undefined,
              borderBottomLeftRadius: !isUser ? '6px' : undefined,
            }}
          >
            {isUser ? (
              <p>{message.content}</p>
            ) : (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-black" style={{ color: '#2D6A4F' }}>{children}</strong>,
                  ul: ({ children }) => <ul className="ml-4 mt-1 space-y-0.5 list-disc">{children}</ul>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {message.tool_calls?.length > 0 && (
          <div className="mt-1 space-y-1">
            {message.tool_calls.map((tc, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-green-800">
                  {tc.status === 'completed' ? '✅' : '⏳'} Consultando base de datos...
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentPage() {
  const [view, setView] = useState('chat');
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    createNewConversation();
  }, []);

  const createNewConversation = async () => {
    setIsCreating(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'mueve_agente',
        metadata: { name: 'Consulta MueveCancún' },
      });
      setConversation(conv);
      setMessages([{
        role: 'assistant',
        content: '¡Hola! Soy el **Agente MueveCancún** 🦜\n\nSoy tu guía de transporte público en Cancún. Puedo ayudarte a:\n\n- 🗺️ **Planificar tu viaje** de A a B\n- 🚌 **Encontrar la ruta** correcta\n- ⏰ **Consultar horarios** y frecuencias\n- 💰 **Informarte sobre tarifas**\n- ⚠️ **Alertarte** de demoras o cambios\n\n**¿A dónde quieres ir hoy?**',
      }]);

      const unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages(data.messages || []);
        setIsLoading(false);
      });

      setConversation({ ...conv, _unsubscribe: unsubscribe });
    } catch (err) {
      console.error('Error creating conversation:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const sendMessage = async (text = input) => {
    if (!text.trim() || !conversation || isLoading) return;
    const msg = text.trim();
    setInput('');
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: msg });
    } catch (err) {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    if (conversation?._unsubscribe) conversation._unsubscribe();
    setConversation(null);
    setMessages([]);
    createNewConversation();
  };

  return (
    <div className="flex flex-col" style={{ backgroundColor: '#FFFBF0', height: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)', flexShrink: 0 }}>
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: '#FFD60A' }}
              >
                <span className="text-2xl">🦜</span>
              </div>
              <div>
                <h1 className="text-white font-black text-lg leading-tight">Agente MueveCancún</h1>
                <div className="flex items-center gap-1.5">
                  <div className="live-dot w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="text-green-100 text-xs font-semibold">
                    {isCreating ? 'Iniciando...' : 'En línea'}
                  </span>
                </div>
              </div>
            </div>
            {view === 'chat' && (
              <button
                onClick={resetConversation}
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <RotateCcw size={18} className="text-white" />
              </button>
            )}
          </div>

          {/* View tabs */}
          <div className="flex gap-2 mt-4">
            {[{ key: 'chat', label: '💬 Chat' }, { key: 'planner', label: '🗺️ Planear viaje' }].map(t => (
              <button key={t.key} onClick={() => setView(t.key)}
                className="flex-1 py-2 rounded-2xl text-sm font-bold transition-all"
                style={{
                  backgroundColor: view === t.key ? '#FFD60A' : 'rgba(255,255,255,0.2)',
                  color: view === t.key ? '#2D6A4F' : 'white',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'planner' && (
        <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
          <TripPlanner />
        </div>
      )}

      {view === 'chat' && <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ paddingBottom: '8px' }}>
        {isCreating ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <span className="text-5xl animate-bounce">🦜</span>
            <p className="text-gray-500 font-semibold">Iniciando el agente...</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))
        )}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}
            >
              <span className="text-lg">🦜</span>
            </div>
            <div
              className="px-4 py-3 rounded-3xl rounded-bl-md flex items-center gap-1.5"
              style={{ backgroundColor: 'white', boxShadow: '0 2px 12px rgba(45,106,79,0.1)' }}
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && !isLoading && (
        <div className="px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="flex-shrink-0 px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap"
                style={{ backgroundColor: 'white', color: '#2D6A4F', border: '1.5px solid #D1FAE5', boxShadow: '0 1px 4px rgba(45,106,79,0.08)' }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: 'white', borderTop: '1px solid #E5E7EB', flexShrink: 0, paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        <input
          type="text"
          placeholder="¿A dónde quieres ir? 🗺️"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={isLoading || isCreating}
          className="flex-1 px-4 py-3 rounded-2xl text-sm font-semibold outline-none"
          style={{ backgroundColor: '#FFFBF0', color: '#2D6A4F', border: '1.5px solid #D1FAE5' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading || isCreating}
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background: input.trim() && !isLoading ? 'linear-gradient(135deg, #2D6A4F, #52B788)' : '#E5E7EB',
            transform: input.trim() && !isLoading ? 'scale(1)' : 'scale(0.95)',
          }}
        >
          <Send size={16} style={{ color: input.trim() && !isLoading ? 'white' : '#9CA3AF' }} />
        </button>
      </div>
      </>}
    </div>
  );
}