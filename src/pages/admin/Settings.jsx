import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, MapPin, Phone, Globe, Clock, Save, Sparkles, Palette,
  Loader2, CheckCircle2, AlertCircle, Link as LinkIcon, RotateCcw, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSalon } from '../../context/SalonContext';
import LogoUpload from '../../components/LogoUpload';
import FormInput from '../../components/ui/FormInput';
import Button from '../../components/ui/Button';

export default function Settings() {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { salon, loading, updateSalon, refreshSalon } = useSalon();
  const [localSalon, setLocalSalon] = useState(null);

  useEffect(() => {
    // Initialize local state when salon data is loaded or refreshed
    if (salon) {
      setLocalSalon(salon);
    }
  }, [salon]);

  const isDirty = useMemo(() => {
    if (!localSalon || !salon) return false;
    // Simple JSON stringify comparison. For more complex objects, a deep-equal library would be better.
    return JSON.stringify(localSalon) !== JSON.stringify(salon);
  }, [localSalon, salon]);

  const THEMES = [
    { id: 'noble', name: 'Noble (Barber)', colors: ['#1A1A1A', '#8B4513', '#F4F1EA'] },
    { id: 'zen', name: 'Zen (Spa)', colors: ['#3E5C52', '#78938A', '#F0F4F2'] },
    { id: 'candy', name: 'Candy (Beauty)', colors: ['#9D174D', '#F472B6', '#FFF5F7'] },
    { id: 'royal', name: 'Royal (Luxury)', colors: ['#D97706', '#FBBF24', '#111827'] },
    { id: 'pure', name: 'Pure (Medical)', colors: ['#0284C7', '#38BDF8', '#FFFFFF'] },
  ];
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!localSalon.name?.trim()) newErrors.name = 'Nome do salão é obrigatório';
    if (!localSalon.slug?.trim()) newErrors.slug = 'Link único é obrigatório';
    else if (/\s/.test(localSalon.slug)) newErrors.slug = 'O link não pode conter espaços';
    
    if (localSalon.opening_time && localSalon.closing_time) {
      if (localSalon.opening_time >= localSalon.closing_time) {
        newErrors.closing_time = 'Horário de fechamento inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Verifique os erros no formulário.');
      return;
    }

    setSubmitting(true);

    try {
      const dataToSave = {
        ...localSalon,
        slug: localSalon.slug.toLowerCase().replace(/\s+/g, '-'),
      };
      await updateSalon(dataToSave);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar as alterações.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setLocalSalon(salon);
    setErrors({});
    toast('Alterações descartadas.');
  };

  if (loading || !localSalon) return (
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
            <FormInput
              label="Nome do Salão"
              value={localSalon.name}
              onChange={e => setLocalSalon({...localSalon, name: e.target.value})}
              required
              error={errors.name}
            />

            <FormInput
              label="Descrição / Slogan"
              value={localSalon.description || ''}
              onChange={e => setLocalSalon({...localSalon, description: e.target.value})}
              multiline
            />

            <FormInput
              label="Link Único (Slug)"
              value={localSalon.slug}
              onChange={e => setLocalSalon({...localSalon, slug: e.target.value})}
              icon={LinkIcon}
              required
              error={errors.slug}
              helperText={`Seu link: cronos.com/booking/${localSalon.slug || 'seu-link'}`}
            />

            <FormInput
              label="Endereço"
              value={localSalon.address}
              onChange={e => setLocalSalon({...localSalon, address: e.target.value})}
            />
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
              <FormInput
                label="Abertura"
                type="time"
                value={localSalon.opening_time}
                onChange={e => setLocalSalon({...localSalon, opening_time: e.target.value})}
                className="font-bold"
                error={errors.opening_time}
              />
              <FormInput
                label="Fechamento"
                type="time"
                value={localSalon.closing_time}
                onChange={e => setLocalSalon({...localSalon, closing_time: e.target.value})}
                className="font-bold"
                error={errors.closing_time}
              />
            </div>
          </section>

          {/* CONFIGURAÇÕES DA AGENDA */}
          <section className="bg-brand-card/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-brand-muted/10 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                <Calendar size={24} />
              </div>
              <h2 className="text-xl font-black text-brand-text">Agenda</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Intervalo (min)"
                type="number"
                placeholder="30"
                value={localSalon.slot_interval || ''}
                onChange={e => setLocalSalon({...localSalon, slot_interval: Number(e.target.value)})}
                helperText="Tempo padrão entre slots"
              />
              <FormInput
                label="Antecedência (horas)"
                type="number"
                placeholder="2"
                value={localSalon.min_booking_hours || ''}
                onChange={e => setLocalSalon({...localSalon, min_booking_hours: Number(e.target.value)})}
                helperText="Mínimo para agendar online"
              />
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
              <FormInput
                label="Telefone"
                placeholder="(00) 00000-0000"
                value={localSalon.phone}
                onChange={e => setLocalSalon({...localSalon, phone: e.target.value})}
              />
              <FormInput
                label="Instagram"
                placeholder="seu_usuario"
                value={localSalon.instagram_user || ''}
                onChange={e => setLocalSalon({...localSalon, instagram_user: e.target.value.replace('@', '')})}
              />
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
                <Button
                  key={theme.id}
                  variant="outline"
                  size="custom"
                  isActive={localSalon.theme_name === theme.id}
                  onClick={() => setLocalSalon({ ...localSalon, theme_name: theme.id })}
                  className="relative flex-col font-normal p-3 rounded-2xl"
                >
                  <div className="flex -space-x-2">
                    {theme.colors.map((c, i) => <div key={c} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c, zIndex: 3-i }} />)}
                  </div>
                  <span className={`font-bold text-xs text-center ${localSalon.theme_name === theme.id ? 'text-brand-primary' : 'text-brand-muted'}`}>{theme.name}</span>
                </Button>
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
              salonId={localSalon.id} 
              currentLogo={localSalon.logo_url} 
              onUploadSuccess={refreshSalon} 
            />
          </section>
        </div>

        <div className="md:col-span-12 flex justify-end items-center gap-4 pt-4">
          {isDirty && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={submitting}
            >
              <RotateCcw size={20} />
              <span>Descartar</span>
            </Button>
          )}
          <Button
            type="submit"
            isLoading={submitting}
            disabled={!isDirty || submitting}
          >
            <Save size={20} />
            <span>Salvar Alterações</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
