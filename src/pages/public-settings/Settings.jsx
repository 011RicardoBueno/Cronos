import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Settings as SettingsIcon, Store, Clock, Globe, 
  Save, Loader2, AlertTriangle 
} from 'lucide-react';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salon, setSalon] = useState({
    id: '',
    name: '',
    address: '',
    phone: '',
    logo_url: '',
    slug: '',
    opening_time: '09:00',
    closing_time: '18:00'
  });

  useEffect(() => {
    fetchSalonData();
  }, []);

  const fetchSalonData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setSalon({
          ...data,
          // Ensure time format is HH:mm for input type="time"
          opening_time: data.opening_time ? data.opening_time.slice(0, 5) : '09:00',
          closing_time: data.closing_time ? data.closing_time.slice(0, 5) : '18:00'
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSalon(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!salon.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('salons')
        .update({
          name: salon.name,
          address: salon.address,
          phone: salon.phone,
          logo_url: salon.logo_url,
          opening_time: salon.opening_time,
          closing_time: salon.closing_time
        })
        .eq('id', salon.id);

      if (error) throw error;
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-surface">
        <Loader2 className="animate-spin text-brand-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
          <SettingsIcon size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-brand-text tracking-tight">Configurações</h1>
          <p className="text-brand-muted">Gerencie as informações do seu estabelecimento.</p>
        </div>
      </div>

      {/* Profile Section */}
      <section className="bg-brand-card p-8 rounded-[2.5rem] border border-brand-muted/20 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Store className="text-brand-primary" size={24} />
          <h2 className="text-xl font-black text-brand-text">Perfil do Salão</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">Nome do Estabelecimento</label>
            <input
              type="text"
              name="name"
              value={salon.name}
              onChange={handleChange}
              className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-4 font-medium text-brand-text focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">Telefone / WhatsApp</label>
            <input
              type="text"
              name="phone"
              value={salon.phone}
              onChange={handleChange}
              className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-4 font-medium text-brand-text focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
            />
          </div>

          <div className="col-span-full space-y-2">
            <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">Endereço Completo</label>
            <input
              type="text"
              name="address"
              value={salon.address}
              onChange={handleChange}
              className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-4 font-medium text-brand-text focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
            />
          </div>

          <div className="col-span-full space-y-2">
            <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">URL do Logo</label>
            <div className="flex gap-4">
              <input
                type="text"
                name="logo_url"
                value={salon.logo_url || ''}
                onChange={handleChange}
                placeholder="https://..."
                className="flex-1 bg-brand-surface border border-brand-muted/20 rounded-xl p-4 font-medium text-brand-text focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
              />
              {salon.logo_url && (
                <div className="w-14 h-14 rounded-xl bg-brand-surface border border-brand-muted/20 overflow-hidden flex-shrink-0">
                  <img src={salon.logo_url} alt="Logo Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Operating Hours Section */}
      <section className="bg-brand-card p-8 rounded-[2.5rem] border border-brand-muted/20 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="text-brand-primary" size={24} />
          <h2 className="text-xl font-black text-brand-text">Horário de Funcionamento</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">Abertura</label>
            <input
              type="time"
              name="opening_time"
              value={salon.opening_time}
              onChange={handleChange}
              className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-4 font-medium text-brand-text focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">Fechamento</label>
            <input
              type="time"
              name="closing_time"
              value={salon.closing_time}
              onChange={handleChange}
              className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-4 font-medium text-brand-text focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
            />
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          Salvar Alterações
        </button>
      </div>

      {/* Slug Preview Section */}
      <section className="bg-brand-card p-8 rounded-[2.5rem] border border-brand-muted/20 shadow-sm mt-8">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="text-brand-primary" size={24} />
          <h2 className="text-xl font-black text-brand-text">Link Público</h2>
        </div>
        
        <div className="bg-brand-surface p-6 rounded-2xl border border-brand-muted/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-brand-muted break-all">
            <span className="font-medium">Seu link de agendamento:</span>
            <br />
            <a 
              href={`${window.location.origin}/booking/${salon.slug}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-brand-primary font-bold hover:underline text-lg"
            >
              {window.location.origin}/booking/{salon.slug}
            </a>
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/booking/${salon.slug}`);
              alert('Link copiado!');
            }}
            className="px-4 py-2 bg-brand-card border border-brand-muted/20 rounded-xl font-bold text-sm hover:bg-brand-muted/5 transition-all"
          >
            Copiar Link
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="mt-12 pt-8 border-t border-brand-muted/10">
        <div className="flex items-center gap-2 mb-4 text-red-500">
          <AlertTriangle size={20} />
          <h3 className="font-bold uppercase tracking-wider text-sm">Zona de Perigo</h3>
        </div>
        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-center justify-between flex-wrap gap-4">
          <div>
            <h4 className="font-bold text-red-900">Alterar Link Personalizado (Slug)</h4>
            <p className="text-sm text-red-700/80">Isso fará com que o link antigo pare de funcionar imediatamente.</p>
          </div>
          <button className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all">
            Alterar Slug
          </button>
        </div>
      </section>
    </div>
  );
}