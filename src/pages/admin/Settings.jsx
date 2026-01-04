import React, { useState, useEffect, useMemo } from 'react';
import { Save, Loader2, RotateCcw, Store, Clock, Palette, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSalon } from '../../context/SalonContext';
import Button from '../../components/ui/Button';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { useNavigate } from 'react-router-dom';
import { useForm } from '../../hooks/useForm';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';

import SettingsProfile from "./SettingsProfile";
import SettingsHours from "./settings/SettingsHours";
import SettingsAgenda from "./settings/SettingsAgenda";
import SettingsContact from "./settings/SettingsContact";
import SettingsPlan from "./settings/SettingsPlan";
import SettingsIntegrations from "./settings/SettingsIntegrations";
import SettingsAppearance from "./settings/SettingsAppearance";
import SettingsLogo from "./settings/SettingsLogo";

// Função de validação extraída do componente
const validateSettings = (values) => {
  const errors = {};
  
  if (!values.name?.trim()) errors.name = 'Nome do salão é obrigatório';
  if (!values.slug?.trim()) errors.slug = 'Link único é obrigatório';
  else if (/\s/.test(values.slug)) errors.slug = 'O link não pode conter espaços';
  
  if (values.opening_time && values.closing_time) {
    if (values.opening_time >= values.closing_time) {
      errors.closing_time = 'Horário de fechamento inválido';
    }
  }
  if (values.lunch_start && values.lunch_end) {
    if (values.lunch_start >= values.lunch_end) {
      errors.lunch_end = 'Fim do almoço deve ser após o início';
    }
    if (values.opening_time && values.closing_time) {
      if (values.lunch_start < values.opening_time) {
        errors.lunch_start = 'O almoço não pode começar antes da abertura';
      }
      if (values.lunch_end > values.closing_time) {
        errors.lunch_end = 'O almoço não pode terminar após o fechamento';
      }
    }
  }
  if (values.webhook_url && !/^https?:\/\//.test(values.webhook_url)) {
    errors.webhook_url = 'A URL deve começar com http:// ou https://';
  }
  return errors;
};

export default function Settings() {
  const navigate = useNavigate();
  const { salon, loading, updateSalon, refreshSalon } = useSalon();
  
  const initialValues = useMemo(() => ({}), []);

  // Hook useForm gerenciando estado e validação
  const {
    values: localSalon,
    errors,
    isSubmitting,
    handleChange,
    setFieldValue,
    handleSubmit,
    resetForm
  } = useForm(initialValues, validateSettings);

  // Define o plano atual, com 'iniciante' como padrão.
  const currentPlan = salon?.plan_type || 'iniciante'; 
  const { canUseCustomTheme } = usePlanFeatures();

  useEffect(() => {
    // Initialize local state when salon data is loaded or refreshed
    if (salon) {
      resetForm(salon);
    }
  }, [salon, resetForm]);

  const isDirty = useMemo(() => {
    if (!localSalon?.id || !salon) return false;
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
  
  const onSubmit = async (values) => {
    try {
      // Cria um objeto limpo apenas com os campos que existem no banco de dados
      // Isso evita erros ao tentar atualizar campos calculados (como plan_type)
      const dataToSave = {
        name: values.name,
        description: values.description,
        slug: values.slug.toLowerCase().replace(/\s+/g, '-'),
        address: values.address,
        opening_time: values.opening_time,
        closing_time: values.closing_time,
        lunch_start: values.lunch_start,
        lunch_end: values.lunch_end,
        slot_interval: values.slot_interval,
        min_booking_hours: values.min_booking_hours,
        phone: values.phone,
        instagram_user: values.instagram_user,
        api_key: values.api_key,
        webhook_url: values.webhook_url,
        theme_name: values.theme_name,
      };
      await updateSalon(dataToSave);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar as alterações.');
    }
  };

  const handleReset = () => {
    resetForm(salon);
    toast('Alterações descartadas.');
  };

  if (loading || !localSalon?.id) return (
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

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit); }}>
        <Tabs defaultValue="perfil">
          <TabsList>
            <TabsTrigger value="perfil" className="flex items-center justify-center gap-2">
              <Store size={18} />
              <span>Perfil & Contato</span>
            </TabsTrigger>
            <TabsTrigger value="funcionamento" className="flex items-center justify-center gap-2">
              <Clock size={18} />
              <span>Horários & Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="aparencia" className="flex items-center justify-center gap-2">
              <Palette size={18} />
              <span>Aparência</span>
            </TabsTrigger>
            <TabsTrigger value="sistema" className="flex items-center justify-center gap-2">
              <Zap size={18} />
              <span>Planos & Integrações</span>
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: PERFIL */}
          <TabsContent value="perfil" className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-7 space-y-8">
              <SettingsProfile values={localSalon} handleChange={handleChange} errors={errors} />
              <SettingsContact values={localSalon} handleChange={handleChange} setFieldValue={setFieldValue} />
            </div>
            <div className="md:col-span-5 space-y-8">
              <SettingsLogo salonId={localSalon.id} logoUrl={localSalon.logo_url} onUploadSuccess={refreshSalon} />
            </div>
          </TabsContent>

          {/* ABA 2: FUNCIONAMENTO */}
          <TabsContent value="funcionamento" className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SettingsHours values={localSalon} handleChange={handleChange} errors={errors} />
            <SettingsAgenda values={localSalon} setFieldValue={setFieldValue} />
          </TabsContent>

          {/* ABA 3: APARÊNCIA */}
          <TabsContent value="aparencia">
            <SettingsAppearance 
              canUseCustomTheme={canUseCustomTheme} 
              values={localSalon} 
              setFieldValue={setFieldValue} 
              themes={THEMES} 
            />
          </TabsContent>

          {/* ABA 4: SISTEMA */}
          <TabsContent value="sistema" className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SettingsPlan currentPlan={currentPlan} />
            <SettingsIntegrations currentPlan={currentPlan} values={localSalon} setFieldValue={setFieldValue} errors={errors} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end items-center gap-4 pt-6 mt-4 border-t border-brand-muted/10">
          {isDirty && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              <RotateCcw size={20} />
              <span>Descartar</span>
            </Button>
          )}
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!isDirty || isSubmitting}
          >
            <Save size={20} />
            <span>Salvar Alterações</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
