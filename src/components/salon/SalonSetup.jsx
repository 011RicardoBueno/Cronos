import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { useAuth } from '../../context/AuthContext'; // Importamos o Auth
import LogoUpload from '../LogoUpload';
import BannerUpload from './BannerUpload';
import { usePlanFeatures } from '../../hooks/usePlanFeatures'; // Importamos o hook de features
import { Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link
import canvasConfetti from 'canvas-confetti'; // Import canvas-confetti

const MAX_SLUG_LENGTH = 50; // Define maximum length for the slug

const SalonSetup = ({ onComplete }) => {
  const { refreshSalon } = useSalon();
  const { user } = useAuth(); // Pegamos os dados do usuário logado

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [newSalon, setNewSalon] = useState(null); // To store {id, name}
  const { canUseCustomBranding } = usePlanFeatures(); // Obtenha as features do plano
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cep: '',
    logradouro: '',
    number: '',
    slug: ''
  });
  
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    cep: '',
    number: '',
    logradouro: '', // For address validation, especially after CEP lookup
    slug: ''
  });
  
  const [cepLoading, setCepLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [slugUniqueStatus, setSlugUniqueStatus] = useState('initial'); // 'initial' | 'checking' | 'available' | 'taken'
  const [slugChecking, setSlugChecking] = useState(false);

  // Debounce utility
  const debounce = (func, delay) => {
    let timeout;
    return function executed(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, delay);
    };
  };

  // Function to check slug uniqueness
  const checkSlugUniqueness = async (slugToCheck) => {
    if (!slugToCheck || !canUseCustomBranding) { // Only check if custom branding is allowed
      setSlugUniqueStatus('initial');
      return;
    }
    setSlugChecking(true);
    setSlugUniqueStatus('checking');
    try {
      const { data, error } = await supabase
        .from('salons')
        .select('slug')
        .eq('slug', slugToCheck)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setSlugUniqueStatus('taken');
      } else {
        setSlugUniqueStatus('available');
      }
    } catch (err) {
      console.error('Error checking slug uniqueness:', err);
      setSlugUniqueStatus('initial'); // Revert or set an error state
    } finally {
      setSlugChecking(false);
    }
  };

  // Debounced version of checkSlugUniqueness
  const debouncedCheckSlug = React.useCallback(debounce(checkSlugUniqueness, 500), [canUseCustomBranding]);

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

  // Effect to check slug uniqueness when slug changes and custom branding is allowed
  useEffect(() => {
    if (canUseCustomBranding && formData.slug && !errors.slug) {
      debouncedCheckSlug(formData.slug);
    } else {
      setSlugUniqueStatus('initial');
    }
  }, [formData.slug, canUseCustomBranding, errors.slug, debouncedCheckSlug]);

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

  const validateField = (name, value) => {
    let errorMessage = '';
    switch (name) {
      case 'name':
        if (value.trim().length < 3) {
          errorMessage = 'O nome do salão deve ter pelo menos 3 caracteres.';
        }
        break;
      case 'phone':
        // Apenas verifica se o telefone formatado tem o número mínimo de dígitos esperado (considerando DDD e 8 ou 9 dígitos)
        const cleanPhone = value.replace(/\D/g, "");
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
          errorMessage = 'Número de telefone inválido.';
        }
        break;
      case 'cep':
        const cleanCEP = value.replace(/\D/g, "");
        if (cleanCEP.length !== 8) {
          errorMessage = 'CEP deve conter 8 dígitos.';
        }
        break;
      case 'number':
        if (value.trim().length === 0) {
          errorMessage = 'Número/Complemento é obrigatório.';
        }
        break;
      case 'logradouro':
        if (value.trim().length === 0) {
          errorMessage = 'Endereço é obrigatório (preencha o CEP).';
        }
        break;
      case 'slug':
        if (value.trim().length === 0) {
          errorMessage = 'O slug do salão é obrigatório.';
        } else if (value.length > MAX_SLUG_LENGTH) {
          errorMessage = `O slug não pode ter mais de ${MAX_SLUG_LENGTH} caracteres.`;
        }
        break;
    }
    return errorMessage;
  };

  const handleCEPChange = async (e) => {
    const cepValue = formatCEP(e.target.value);
    setFormData(prev => ({ ...prev, cep: cepValue }));

    // Clear general submit error when user starts typing
    if (submitError) setSubmitError('');

    const cleanCEP = cepValue.replace(/\D/g, "");
    // Validate CEP format instantly
    setErrors(prev => ({ ...prev, cep: validateField('cep', cepValue) }));

    if (cleanCEP.length === 8) {
      setCepLoading(true);
      setErrors(prev => ({ ...prev, logradouro: '' })); // Clear previous logradouro error
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        if (data.erro) {
          setErrors(prev => ({ ...prev, cep: 'CEP não encontrado.', logradouro: 'Preencha um CEP válido.' }));
          setFormData(prev => ({ ...prev, logradouro: '' }));
        } else {
          setErrors(prev => ({ ...prev, cep: '', logradouro: '' })); // Clear CEP errors
          const autoAddress = `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`;
          setFormData(prev => ({ ...prev, logradouro: autoAddress }));
        }
      } catch (err) {
        console.error(err);
        setErrors(prev => ({ ...prev, cep: 'Erro ao buscar CEP.', logradouro: 'Erro ao buscar CEP.' }));
        setFormData(prev => ({ ...prev, logradouro: '' }));
      } finally {
        setCepLoading(false);
      }
    } else {
      // If CEP length is not 8, clear logradouro and set error
      setFormData(prev => ({ ...prev, logradouro: '' }));
      setErrors(prev => ({ ...prev, logradouro: 'Preencha um CEP válido para buscar o endereço.' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFieldValue = value;

    if (name === 'phone') {
      newFieldValue = formatPhone(value);
    }

    setFormData(prev => {
      let updatedPrev = { ...prev, [name]: newFieldValue };

      if (name === 'name') {
        if (!canUseCustomBranding) {
          updatedPrev.slug = generateSlug(newFieldValue);
        }
      } else if (name === 'slug' && canUseCustomBranding) {
        updatedPrev.slug = generateSlug(newFieldValue); // Ensure slug is always formatted correctly
        setErrors(prevErrors => ({ ...prevErrors, slug: '' })); // Clear slug error on change
        setSlugUniqueStatus('initial'); // Reset status on manual change
      }
      return updatedPrev;
    });

    // Validate field and update errors
    const error = validateField(name, newFieldValue);
    setErrors(prev => ({ ...prev, [name]: error }));

    // Clear general submit error when user starts typing
    if (submitError) setSubmitError('');
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError('');

    const newErrors = {};
    Object.keys(formData).forEach(fieldName => {
      // Skip slug validation if custom branding is not allowed, as it's auto-generated
      if (fieldName === 'slug' && !canUseCustomBranding) {
        return;
      }
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    // Also explicitly validate logradouro after CEP fetch, in case it's still empty
    if (!formData.logradouro.trim()) {
      newErrors.logradouro = 'Endereço é obrigatório (preencha o CEP).';
    }
    if (!formData.cep.trim()) {
      newErrors.cep = 'CEP é obrigatório.';
    }
    if (!formData.number.trim()) {
      newErrors.number = 'Número/Complemento é obrigatório.';
    }


          setErrors(newErrors);
    
          const hasErrors = Object.values(newErrors).some(error => error !== '');
          if (hasErrors) {
            setLoading(false);
            return;
          }
          
          // Re-add check for user ID and pass it explicitly
          if (!user?.id) {
            setSubmitError('Erro: ID do usuário não disponível. Por favor, tente novamente ou entre em contato com o suporte.');
            setLoading(false);
            return;
          }

          console.log('User ID before RPC:', user?.id); // Debugging line
          console.log('Supabase session before RPC:', await supabase.auth.getSession()); // Debugging line for session

          try {
            const fullAddress = `${formData.logradouro}, nº ${formData.number}`;
      
            // Use the secure RPC function to create salon and link owner
            const { data: newSalonId, error } = await supabase.rpc('create_salon_for_user', {
              salon_name: formData.name,
              salon_slug: formData.slug,
              salon_phone: formData.phone, // Add phone
              salon_address: fullAddress, // Add address
            });
      if (error) throw error;

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
    <div className="min-h-screen bg-brand-surface flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg mb-4">
        <div className="flex bg-brand-surface rounded-full h-2">
          <div className={`h-full rounded-full bg-brand-primary transition-all duration-500 ease-out ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
        </div>
      </div>
      <div className="bg-brand-card rounded-3xl p-8 md:p-10 shadow-2xl w-full max-w-lg">
        
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <p className="text-sm text-brand-muted font-semibold mb-2">Passo 1 de 2</p>
              <h2 className="text-3xl font-extrabold text-brand-text mb-2">👋 Quase lá!</h2>
              <p className="text-brand-muted">Confirme os dados do seu salão para ativar sua agenda.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-brand-text mb-2">Nome do Salão *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Como seus clientes te conhecem?"
                  className={`w-full p-3 bg-brand-surface border rounded-xl outline-none ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-brand-muted/20 focus:border-brand-primary'}`}
                  required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-brand-text mb-2">Link do Salão (Slug) *</label>
                <input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  readOnly={!canUseCustomBranding}
                  placeholder={canUseCustomBranding ? "nome-do-seu-salao" : "Gerado automaticamente"}
                  className={`w-full p-3 bg-brand-surface border rounded-xl outline-none ${errors.slug || (slugUniqueStatus === 'taken' && canUseCustomBranding) ? 'border-red-500 focus:border-red-500' : (!canUseCustomBranding ? 'cursor-not-allowed bg-brand-surface/50 text-brand-muted' : 'border-brand-muted/20 focus:border-brand-primary')}`}
                  maxLength={MAX_SLUG_LENGTH} // Add max length
                />
                {!canUseCustomBranding && (
                  <p className="text-brand-muted text-xs mt-1">
                    Personalize seu link de agendamento com um plano Profissional ou Enterprise. <Link to="/planos" className="text-brand-primary hover:underline">Saiba Mais</Link>
                  </p>
                )}
                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
                {canUseCustomBranding && formData.slug && !errors.slug && (
                  <>
                    {slugChecking && <p className="text-brand-muted text-xs mt-1 flex items-center gap-1"><Loader2 className="animate-spin" size={12} /> Verificando...</p>}
                    {slugUniqueStatus === 'available' && <p className="text-green-500 text-xs mt-1">Slug disponível!</p>}
                    {slugUniqueStatus === 'taken' && <p className="text-red-500 text-xs mt-1">Slug já em uso.</p>}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-text mb-2">WhatsApp / Telefone *</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  className={`w-full p-3 bg-brand-surface border rounded-xl outline-none ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-brand-muted/20 focus:border-brand-primary'}`}
                  required
                  maxLength={15}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-brand-text mb-2">CEP *</label>
                  <input
                    name="cep"
                    value={formData.cep}
                    onChange={handleCEPChange}
                    placeholder="00000-000"
                    className={`w-full p-3 bg-brand-surface border rounded-xl outline-none ${errors.cep ? 'border-red-500 focus:border-red-500' : 'border-brand-muted/20 focus:border-brand-primary'}`}
                    required
                  />
                  {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-brand-text mb-2">Número / Compl. *</label>
                  <input
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    placeholder="Ex: 123, Sala 2"
                    className={`w-full p-3 bg-brand-surface border rounded-xl outline-none ${errors.number ? 'border-red-500 focus:border-red-500' : 'border-brand-muted/20 focus:border-brand-primary'}`}
                    required
                  />
                  {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-text mb-2">Endereço Completo</label>
                <input
                  name="logradouro"
                  value={formData.logradouro}
                  readOnly
                  placeholder={cepLoading ? "Buscando endereço..." : "Preencha o CEP acima"}
                  className={`w-full p-3 bg-brand-surface/50 border rounded-xl outline-none cursor-not-allowed ${errors.logradouro ? 'border-red-500 text-red-500' : 'border-brand-muted/20 text-brand-muted'}`}
                />
                {errors.logradouro && <p className="text-red-500 text-xs mt-1">{errors.logradouro}</p>}
              </div>

              <div className="p-4 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
                <label className="block text-xs font-bold text-brand-primary mb-1">Seu link de agendamento:</label>
                <div className="flex items-center gap-1">
                  <span className="text-brand-primary font-bold text-sm">fluxo.com/p/{formData.slug || 'link-do-salao'}</span>
                </div>
              </div>

              {(submitError) && <div className="p-3 bg-red-500/10 text-red-600 border border-red-500/20 rounded-xl text-sm text-center">{submitError}</div>}

              <button type="submit" disabled={loading || cepLoading || slugChecking || (canUseCustomBranding && slugUniqueStatus === 'taken')} className="w-full p-4 bg-brand-primary text-white rounded-xl text-base font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading || cepLoading || slugChecking ? <Loader2 className="animate-spin" /> : 'Continuar'}
              </button>
            </form>
          </>
        )}

        {step === 2 && newSalon && (
          <div className="text-center space-y-6 animate-in fade-in">
            <p className="text-sm text-brand-muted font-semibold mb-2">Passo 2 de 2</p>
            <Sparkles className="mx-auto text-brand-primary" size={48} />
            <h2 className="text-2xl font-extrabold text-brand-text">Personalize sua Marca</h2>
            <p className="text-brand-muted">Envie as imagens que representarão seu salão.</p>
            {canUseCustomBranding ? (
              <div className="space-y-4">
                <LogoUpload salonId={newSalon.id} />
                <BannerUpload salonId={newSalon.id} />
              </div>
            ) : (
              <div className="p-4 bg-brand-primary/10 rounded-xl border border-brand-primary/20 text-brand-primary">
                <p className="font-bold mb-2">Recurso Premium</p>
                <p className="text-sm">Faça upgrade para um plano Profissional ou Enterprise para personalizar seu Logo e Banner. <Link to="/planos" className="text-brand-primary hover:underline">Saiba Mais</Link></p>
              </div>
            )}
            <button onClick={() => {
              canvasConfetti.default({ // Use .default for commonjs interop
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
              });
              onComplete();
            }} className="w-full p-4 bg-brand-primary text-white rounded-xl font-bold transition-all hover:opacity-90">
              Concluir e ir para o Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalonSetup;