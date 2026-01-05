// src/components/dashboard/CustomerForm.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCustomer } from '@/hooks/useCreateCustomer';
import { useSalon } from '@/context/SalonContext';
import { Loader2, AlertCircle, Lock, CheckCircle } from 'lucide-react';
import IMask from 'imask';

const FREE_PLAN_LIMIT = 50;

const ERROR_MESSAGES = {
  DUPLICATE_CUSTOMER: 'Este cliente já está cadastrado.',
  INVALID_PHONE: 'Número de telefone inválido.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  INTERNAL_ERROR: 'Ocorreu um erro inesperado. Tente novamente.',
};

// Componente de upsell para limite de plano gratuito
function PlanLimitUpsell({ onUpgrade, onCancel }) {
  return (
    <div className="p-6 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="text-brand-primary" size={32} />
      </div>
      <h3 className="text-xl font-bold text-brand-text mb-2">Limite do Plano Gratuito</h3>
      <p className="text-brand-muted mb-6">
        Você atingiu o limite de {FREE_PLAN_LIMIT} clientes do plano gratuito. 
        Desbloqueie clientes ilimitados e impulsione seu negócio com o plano Profissional.
      </p>
      
      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-2 text-sm text-brand-text">
          <CheckCircle size={16} className="text-green-500" /> <span>Clientes Ilimitados</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-brand-text">
          <CheckCircle size={16} className="text-green-500" /> <span>Agenda Completa</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-brand-text">
          <CheckCircle size={16} className="text-green-500" /> <span>Relatórios Financeiros</span>
        </div>
      </div>

      <button 
        onClick={onUpgrade}
        className="w-full py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20"
      >
        Fazer Upgrade Agora
      </button>
      <button 
        onClick={onCancel}
        className="mt-4 text-sm text-brand-muted hover:text-brand-text underline"
      >
        Voltar
      </button>
    </div>
  );
}

export default function CustomerForm({ onSuccess, onCancel }) {
  const { salon } = useSalon();
  const navigate = useNavigate();
  const { createCustomer, loading, error, errorCode, reset } = useCreateCustomer();
  
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [validationError, setValidationError] = useState(null);

  const phoneRef = useRef(null);

  // Aplica máscara de telefone sem warnings do React
  useEffect(() => {
    if (!phoneRef.current) return;

    const mask = IMask(phoneRef.current, {
      mask: '+{55} (00) 00000-0000', // formato brasileiro
      lazy: false,
    });

    mask.on('accept', () => {
      setFormData(prev => ({ ...prev, phone: mask.value }));
      if (validationError) setValidationError(null);
      if (errorCode) reset();
    });

    return () => mask.destroy();
  }, [validationError, errorCode, reset]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationError) setValidationError(null);
    if (errorCode) reset();
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!salon?.id) return;

    const cleanName = formData.name.trim();
    const cleanPhone = formData.phone.replace(/\D/g, '');
    const cleanEmail = formData.email.trim();

    if (cleanPhone.length < 8) {
      setValidationError('O telefone deve ter pelo menos 8 dígitos.');
      return;
    }

    // ⚡ Chamada da função Supabase com Service Role Key já no backend
    const result = await createCustomer({
      salon_id: salon.id,
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail
    });

    if (result.success) onSuccess(result.data);
  };

  // Mostrar upsell caso limite de plano gratuito
  if (errorCode === 'PLAN_LIMIT_REACHED') {
    return <PlanLimitUpsell onUpgrade={() => navigate('/admin/settings/subscription')} onCancel={handleCancel} />;
  }

  const displayedError = validationError || (errorCode && ERROR_MESSAGES[errorCode]) || error;

  const inputClass = (hasError) =>
    `w-full bg-brand-surface border rounded-xl p-3 text-brand-text focus:ring-2 outline-none transition-all disabled:opacity-50 ${
      hasError ? 'border-red-300 focus:ring-red-200' : 'border-brand-muted/20 focus:ring-brand-primary/50'
    }`;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-brand-text">Novo Cliente</h3>
      </div>

      {displayedError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2" role="alert">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{displayedError}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Nome Completo *</label>
        <input
          type="text"
          name="name"
          required
          disabled={loading}
          value={formData.name}
          onChange={handleChange}
          placeholder="Ex: Maria Silva"
          className={inputClass(false)}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Telefone (WhatsApp) *</label>
        <input
          type="tel"
          name="phone"
          required
          disabled={loading}
          ref={phoneRef}
          value={formData.phone}
          placeholder="+55 (11) 99999-9999"
          className={inputClass(!!validationError || errorCode === 'INVALID_PHONE' || errorCode === 'DUPLICATE_CUSTOMER')}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Email (Opcional)</label>
        <input
          type="email"
          name="email"
          disabled={loading}
          value={formData.email}
          onChange={handleChange}
          placeholder="Ex: maria@email.com"
          className={inputClass(false)}
        />
      </div>

      <div className="pt-4 flex gap-3">
        <button type="button" onClick={handleCancel} disabled={loading} className="flex-1 py-3 rounded-xl font-bold text-brand-muted hover:bg-brand-surface transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-colors flex justify-center items-center disabled:opacity-70">
          {loading ? <Loader2 className="animate-spin" /> : 'Cadastrar'}
        </button>
      </div>
    </form>
  );
}
