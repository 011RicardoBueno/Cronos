import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Store, MapPin, Phone, Globe, Clock, Save, Sparkles, Palette,
  Loader2, CheckCircle2, AlertCircle, Link as LinkIcon
} from 'lucide-react';
import LogoUpload from '../../components/LogoUpload';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const THEMES = [
    { id: 'noble', name: 'Noble (Barber)', colors: ['#1A1A1A', '#8B4513', '#F4F1EA'] },
    { id: 'zen', name: 'Zen (Spa)', colors: ['#3E5C52', '#78938A', '#F0F4F2'] },
    { id: 'candy', name: 'Candy (Beauty)', colors: ['#9D174D', '#F472B6', '#FFF5F7'] },
    { id: 'royal', name: 'Royal (Luxury)', colors: ['#D97706', '#FBBF24', '#111827'] },
    { id: 'pure', name: 'Pure (Medical)', colors: ['#0284C7', '#38BDF8', '#FFFFFF'] },
  ];
  
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    slug: '',
    address: '',
    phone: '',
    logo_url: '',
    description: '',
    instagram_user: '',
    opening_time: '09:00',
    closing_time: '18:00',
    theme_name: 'noble'
  });

  async function loadSalonData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;
      if (data) setFormData(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSalonData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('salons')
        .update({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          logo_url: formData.logo_url,
          instagram_user: formData.instagram_user,
          description: formData.description,
          opening_time: formData.opening_time,
          closing_time: formData.closing_time,
          // Slug geralmente é travado por segurança, mas permitimos aqui
          slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
          theme_name: formData.theme_name
        })
        .eq('id', formData.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar alterações.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-brand-primary" size={32} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-black text-brand-text tracking-tight">Configurações</h1>
        <p className="text-brand-muted">Gerencie a identidade e as regras do seu salão.</p>
      </header>

      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA */}
        <div className="md:col-span-7 space-y-8">
          {/* PERFIL DO SALÃO */}
          <section className="bg-brand-card/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-brand-muted/10 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
              <Store size={24} />
            </div>
            <h2 className="text-xl font-black text-brand-text">Perfil</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase text-brand-muted ml-1">Nome do Salão</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-brand-surface border border-brand-muted/20 rounded-2xl p-4 mt-1 outline-none focus:border-brand-primary hover:border-brand-primary/40 transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-brand-muted ml-1">Descrição / Slogan</label>
              <textarea 
                value={formData.description || ''}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-brand-surface border border-brand-muted/20 rounded-2xl p-4 mt-1 outline-none focus:border-brand-primary hover:border-brand-primary/40 transition-all font-medium min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-brand-muted ml-1">Link Único (Slug)</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
                <input 
                  type="text" 
                  value={formData.slug}
                  onChange={e => setFormData({...formData, slug: e.target.value})}
                  className="w-full bg-brand-surface border border-brand-muted/20 rounded-2xl p-4 pl-12 mt-1 outline-none focus:border-brand-primary hover:border-brand-primary/40 transition-all font-medium"
                  required
                />
              </div>
              <p className="text-[10px] text-brand-muted mt-2 ml-1 italic">
                Seu link: cronos.com/booking/{formData.slug || 'seu-link'}
              </p>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-brand-muted ml-1">Endereço</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full bg-brand-surface border border-brand-muted/20 rounded-2xl p-4 mt-1 outline-none focus:border-brand-primary hover:border-brand-primary/40 transition-all font-medium"
              />
            </div>
          </div>
        </section>

          {/* HORÁRIOS DE FUNCIONAMENTO */}
          <section className="bg-brand-card/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-brand-muted/10 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                <Clock size={24} />
              </div>
              <h2 className="text-xl font-black text-brand-text">Funcionamento</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase text-brand-muted ml-1">Abertura</label>
                <input 
                  type="time" 
                  value={formData.opening_time}
                  onChange={e => setFormData({...formData, opening_time: e.target.value})}
                  className="w-full bg-brand-surface border border-brand-muted/20 rounded-2xl p-4 mt-1 outline-none focus:border-brand-primary hover:border-brand-primary/40 transition-all font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-brand-muted ml-1">Fechamento</label>
                <input 
                  type="time" 
                  value={formData.closing_time}
                  onChange={e => setFormData({...formData, closing_time: e.target.value})}
                  className="w-full bg-brand-surface border border-brand-muted/20 rounded-2xl p-4 mt-1 outline-none focus:border-brand-primary hover:border-brand-primary/40 transition-all font-bold"
                />
              </div>
            </div>
          </section>

          {/* CONTATO (Moved to Left Column) */}
          <section className="bg-brand-card/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-brand-muted/10 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                <Phone size={24} />
              </div>
              <h2 className="text-xl font-black text-brand-text">Contato</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-brand-muted ml-1">Telefone</label>
                <input 
                  type="text" 
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-brand-surface border border-brand-muted/20 rounded-2xl p-4 mt-1 outline-none focus:border-brand-primary hover:border-brand-primary/40 transition-all font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-brand-muted ml-1">Instagram</label>
                <input 
                  type="text" 
                  placeholder="seu_usuario"
                  value={formData.instagram_user || ''}
                  onChange={e => setFormData({...formData, instagram_user: e.target.value.replace('@', '')})}
                  className="w-full bg-brand-surface border border-brand-muted/20 rounded-2xl p-4 mt-1 outline-none focus:border-brand-primary hover:border-brand-primary/40 transition-all font-medium"
                />
              </div>
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA */}
        <div className="md:col-span-5 space-y-8">
          {/* APARÊNCIA / TEMA */}
          <section className="bg-brand-card/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-brand-muted/10 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
              <Palette size={24} />
            </div>
            <h2 className="text-xl font-black text-brand-text">Aparência</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <label className="text-xs font-black uppercase text-brand-muted ml-1">Tema do Agendamento</label>
            <div className="flex flex-wrap gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, theme_name: theme.id })}
                  className={`relative flex flex-col items-center gap-3 p-3 rounded-2xl border-2 transition-all ${formData.theme_name === theme.id ? 'border-brand-primary ring-2 ring-brand-primary bg-brand-primary/5' : 'border-brand-muted/10 hover:border-brand-primary/30 hover:bg-brand-surface'}`}
                >
                  <div className="flex -space-x-2">
                    {theme.colors.map((c, i) => <div key={c} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c, zIndex: 3-i }} />)}
                  </div>
                  <span className={`font-bold text-xs text-center ${formData.theme_name === theme.id ? 'text-brand-primary' : 'text-brand-muted'}`}>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

          {/* Logo Upload Section (Sticky) */}
          <section className="sticky top-6 bg-brand-card/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-brand-muted/10 space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                 <Sparkles size={24} />
               </div>
               <h2 className="text-xl font-black text-brand-text">Logo</h2>
            </div>
            <LogoUpload 
              salonId={formData.id} 
              currentLogo={formData.logo_url} 
              onUploadSuccess={loadSalonData} 
            />
          </section>
        </div>

        <div className="md:col-span-12 flex justify-end pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-primary text-white px-12 py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Salvar Alterações</>}
          </button>
        </div>
      </form>
    </div>
  );
}
