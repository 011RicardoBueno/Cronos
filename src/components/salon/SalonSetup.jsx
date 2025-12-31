import React, { useState, useEffect } from 'react';
import { useSalon } from '../../context/SalonContext';
import { useAuth } from '../../context/AuthContext'; // Importamos o Auth
import { COLORS } from '../../constants/dashboard';

const SalonSetup = ({ onComplete }) => {
  const { createOrUpdateSalon, loading, error: contextError } = useSalon();
  const { user } = useAuth(); // Pegamos os dados do usuário logado
  
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
      
      await createOrUpdateSalon({
        name: formData.name,
        phone: formData.phone,
        cep: formData.cep,
        address: fullAddress,
        slug: formData.slug
      });
      
      if (onComplete) onComplete();
    } catch (err) {
      setSubmitError(err.message || 'Erro ao salvar as configurações.');
    }
  };

  const styles = {
    label: { display: 'block', marginBottom: '8px', color: COLORS.deepCharcoal, fontWeight: '700', fontSize: '14px' },
    input: { width: '100%', padding: '14px 16px', border: `1px solid #E5E7EB`, borderRadius: '12px', fontSize: '16px', backgroundColor: '#FFFFFF', color: COLORS.deepCharcoal, boxSizing: 'border-box', outline: 'none', transition: 'all 0.2s' }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.offWhite, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.08)', maxWidth: '500px', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ color: COLORS.deepCharcoal, fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>👋 Quase lá!</h2>
          <p style={{ color: '#6B7280', fontSize: '16px', lineHeight: '1.5' }}>Confirme os dados do seu salão para ativar sua agenda.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Nome do Salão *</label>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Como seus clientes te conhecem?" style={styles.input} required />
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>WhatsApp / Telefone *</label>
              <input name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000" style={styles.input} required maxLength={15} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>CEP *</label>
              <input name="cep" value={formData.cep} onChange={handleCEPChange} placeholder="00000-000" style={styles.input} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Número / Compl. *</label>
              <input name="number" value={formData.number} onChange={handleChange} placeholder="Ex: 123, Sala 2" style={styles.input} required />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Endereço Completo</label>
            <input 
              name="logradouro" 
              value={formData.logradouro} 
              readOnly
              placeholder={cepLoading ? "Buscando endereço..." : "Preencha o CEP acima"} 
              style={{ ...styles.input, backgroundColor: '#F9FAFB', cursor: 'not-allowed', color: '#6B7280' }} 
            />
          </div>

          <div style={{ marginBottom: '30px', padding: '16px', backgroundColor: '#F0FDF4', borderRadius: '12px', border: `1px solid ${COLORS.sageGreen}` }}>
            <label style={{ ...styles.label, marginBottom: '4px', fontSize: '12px', color: '#166534' }}>Seu link de agendamento:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#166534', fontWeight: '800', fontSize: '14px' }}>fluxo.com/p/{formData.slug || 'link-do-salao'}</span>
            </div>
          </div>

          {(submitError || contextError) && (
            <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', textAlign: 'center', border: '1px solid #fee2e2' }}>
              {submitError || contextError}
            </div>
          )}

          <button type="submit" disabled={loading || cepLoading} style={{ width: '100%', padding: '18px', backgroundColor: COLORS.sageGreen, color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: (loading || cepLoading) ? 'not-allowed' : 'pointer', opacity: (loading || cepLoading) ? 0.7 : 1, transition: 'all 0.2s' }}>
            {loading ? 'Criando Salão...' : 'Ativar Minha Agenda'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SalonSetup;