import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { useAuth } from '../../context/AuthContext'; // Importamos o Auth
import LogoUpload from '../LogoUpload';
import BannerUpload from './BannerUpload'; // Corrigido: removido as chaves
import { Loader2, Sparkles } from 'lucide-react';

const SalonSetup = ({ onComplete }) => {
  const { refreshSalon } = useSalon();
  const { user } = useAuth(); // Pegamos os dados do usuário logado

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [newSalon, setNewSalon] = useState(null); // To store {id, name}
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cep: '',
    logradouro: '',
    number: '',
    slug: ''
  });
  
  const [cepLoading, setCepLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Efeito para pré-preencher os dados vindos do cadastro
  useEffect(() => {
    if (user?.user_metadata) {
      const { full_name, phone } = user.user_metadata;
      
      setFormData(prev => ({
        ...prev,
        name: full_name || '',
        phone: formatPhone(phone || ''),
        slug: generateSlug(full_name || '')
      }));
    }
  }, [user]);

  const formatPhone = (value) => {
    if (!value) return "";
    const cleanPhone = value.replace(/\D/g, "");
    if (cleanPhone.length <= 11) {
      return cleanPhone.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
    }
    return cleanPhone.substring(0, 11).replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const formatCEP = (value) => {
    return value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").substring(0, 9);
  };

  const generateSlug = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9\s-]/g, "")   // Remove caracteres especiais
      .replace(/[\s-]+/g, "-");       // Substitui espaços por hifen
  };

  const handleCEPChange = async (e) => {
    const cepValue = formatCEP(e.target.value);
    setFormData(prev => ({ ...prev, cep: cepValue }));

    const cleanCEP = cepValue.replace(/\D/g, "");
    if (cleanCEP.length === 8) {
      setCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        if (data.erro) {
          setSubmitError('CEP não encontrado.');
        } else {
          setSubmitError('');
          const autoAddress = `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`;
          setFormData(prev => ({ ...prev, logradouro: autoAddress }));
        }
      } catch (err) {
        console.error(err);
        setSubmitError('Erro ao buscar CEP.');
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, phone: formatPhone(value) }));
    } else if (name === 'name') {
      setFormData(prev => ({ ...prev, name: value, slug: generateSlug(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError('');

    if (formData.name.trim().length < 3) {
      setSubmitError('O nome do salão deve ter pelo menos 3 caracteres.');
      return;
    }

    if (!formData.logradouro || !formData.cep) {
      setSubmitError('Por favor, preencha os dados de endereço via CEP.');
      return;
    }

    try {
      const fullAddress = `${formData.logradouro}, nº ${formData.number}`;

      // Use the secure RPC function to create salon and link owner
      const { data: newSalonId, error } = await supabase.rpc('create_salon_for_user', {
        salon_name: formData.name,
        salon_slug: formData.slug,
        // You can add more fields to the RPC function if needed,
        // or update them in a subsequent step.
      });

      if (error) throw error;

      // Update the rest of the salon info
      await supabase.from('salons').update({ phone: formData.phone, address: fullAddress }).eq('id', newSalonId);

      setNewSalon({ id: newSalonId, name: formData.name });
      await refreshSalon(); // Refresh context to remove 'needsSetup' flag
      setStep(2); // Move to logo upload step

    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Erro ao salvar as configurações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface flex justify-center items-center p-4">
      <div className="bg-brand-card rounded-3xl p-8 md:p-10 shadow-2xl w-full max-w-lg">
        
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-brand-text mb-2">👋 Quase lá!</h2>
              <p className="text-brand-muted">Confirme os dados do seu salão para ativar sua agenda.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-brand-text mb-2">Nome do Salão *</label>
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Como seus clientes te conhecem?" className="w-full p-3 bg-brand-surface border border-brand-muted/20 rounded-xl outline-none focus:border-brand-primary" required />
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-text mb-2">WhatsApp / Telefone *</label>
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000" className="w-full p-3 bg-brand-surface border border-brand-muted/20 rounded-xl outline-none focus:border-brand-primary" required maxLength={15} />
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-brand-text mb-2">CEP *</label>
                  <input name="cep" value={formData.cep} onChange={handleCEPChange} placeholder="00000-000" className="w-full p-3 bg-brand-surface border border-brand-muted/20 rounded-xl outline-none focus:border-brand-primary" required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-brand-text mb-2">Número / Compl. *</label>
                  <input name="number" value={formData.number} onChange={handleChange} placeholder="Ex: 123, Sala 2" className="w-full p-3 bg-brand-surface border border-brand-muted/20 rounded-xl outline-none focus:border-brand-primary" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-text mb-2">Endereço Completo</label>
                <input name="logradouro" value={formData.logradouro} readOnly placeholder={cepLoading ? "Buscando endereço..." : "Preencha o CEP acima"} className="w-full p-3 bg-brand-surface/50 border border-brand-muted/20 rounded-xl outline-none cursor-not-allowed text-brand-muted" />
              </div>

              <div className="p-4 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
                <label className="block text-xs font-bold text-brand-primary mb-1">Seu link de agendamento:</label>
                <div className="flex items-center gap-1">
                  <span className="text-brand-primary font-bold text-sm">fluxo.com/p/{formData.slug || 'link-do-salao'}</span>
                </div>
              </div>

              {(submitError) && <div className="p-3 bg-red-500/10 text-red-600 border border-red-500/20 rounded-xl text-sm text-center">{submitError}</div>}

              <button type="submit" disabled={loading || cepLoading} className="w-full p-4 bg-brand-primary text-white rounded-xl text-base font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading || cepLoading ? <Loader2 className="animate-spin" /> : 'Continuar'}
              </button>
            </form>
          </>
        )}

        {step === 2 && newSalon && (
          <div className="text-center space-y-6 animate-in fade-in">
            <Sparkles className="mx-auto text-brand-primary" size={48} />
            <h2 className="text-2xl font-extrabold text-brand-text">Personalize sua Marca</h2>
            <p className="text-brand-muted">Envie as imagens que representarão seu salão. <br/>(Este passo é opcional)</p>
            <div className="space-y-4">
              <LogoUpload salonId={newSalon.id} plan="pro" />
              <BannerUpload salonId={newSalon.id} plan="pro" />
            </div>
            <button onClick={onComplete} className="w-full p-4 bg-brand-primary text-white rounded-xl font-bold transition-all hover:opacity-90">
              Concluir e ir para o Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalonSetup;