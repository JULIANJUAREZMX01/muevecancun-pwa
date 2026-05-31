import { useState } from 'react';
import { Mail, MessageCircle, Instagram, Send } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple mailto fallback — no backend required
    const subject = encodeURIComponent(`Contacto MueveCancún - ${form.name}`);
    const body = encodeURIComponent(`Nombre: ${form.name}\nEmail: ${form.email}\n\nMensaje:\n${form.message}`);
    window.location.href = `mailto:contacto@muevecancun.mx?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFBF0' }}>
      <div style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}>
        <div className="px-5 pt-12 pb-6">
          <span className="text-4xl">📬</span>
          <h1 className="text-white font-black text-2xl mt-2">Contáctanos</h1>
          <p className="text-green-100 text-sm mt-1">Estamos aquí para ayudarte</p>
        </div>
      </div>

      <div className="px-5 py-6 space-y-5 pb-28">
        {/* Direct contact methods */}
        <div className="bg-white rounded-3xl p-5 space-y-3" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
          <h2 className="font-black text-base" style={{ color: '#2D6A4F' }}>Canales de contacto</h2>

          <a href="mailto:contacto@muevecancun.mx"
            className="flex items-center gap-4 p-3 rounded-2xl transition-all active:scale-95"
            style={{ backgroundColor: '#F0FDF4' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#D1FAE5' }}>
              <Mail size={18} style={{ color: '#2D6A4F' }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#1F2937' }}>Correo electrónico</p>
              <p className="text-xs" style={{ color: '#2D6A4F' }}>contacto@muevecancun.mx</p>
            </div>
          </a>

          <a href="https://wa.me/529981234567" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-3 rounded-2xl transition-all active:scale-95"
            style={{ backgroundColor: '#F0FDF4' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#D1FAE5' }}>
              <MessageCircle size={18} style={{ color: '#25D366' }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#1F2937' }}>WhatsApp</p>
              <p className="text-xs text-gray-500">+52 998 123 4567</p>
            </div>
          </a>

          <a href="https://instagram.com/muevecancun" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-3 rounded-2xl transition-all active:scale-95"
            style={{ backgroundColor: '#F0FDF4' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FCE7F3' }}>
              <Instagram size={18} style={{ color: '#E1306C' }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#1F2937' }}>Instagram</p>
              <p className="text-xs text-gray-500">@muevecancun</p>
            </div>
          </a>
        </div>

        {/* Contact form */}
        <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
          <h2 className="font-black text-base mb-4" style={{ color: '#2D6A4F' }}>Envíanos un mensaje</h2>

          {sent ? (
            <div className="text-center py-6">
              <span className="text-5xl block mb-3">✅</span>
              <p className="font-black text-base" style={{ color: '#2D6A4F' }}>¡Mensaje enviado!</p>
              <p className="text-sm text-gray-500 mt-1">Te responderemos a la brevedad posible.</p>
              <button onClick={() => setSent(false)} className="mt-4 text-xs font-bold underline" style={{ color: '#2D6A4F' }}>
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase mb-1 block">Tu nombre</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nombre completo"
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none"
                  style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#1F2937' }}
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase mb-1 block">Tu correo</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="tu@correo.com"
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none"
                  style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#1F2937' }}
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase mb-1 block">Mensaje</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="¿En qué podemos ayudarte?"
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none resize-none"
                  style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#1F2937' }}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}
              >
                <Send size={15} />
                Enviar mensaje
              </button>
            </form>
          )}
        </div>

        <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: '#FFF9E6', border: '2px dashed #FFD60A' }}>
          <p className="text-sm font-bold" style={{ color: '#92400E' }}>⏱️ Tiempo de respuesta promedio: 24 horas</p>
        </div>
      </div>
    </div>
  );
}