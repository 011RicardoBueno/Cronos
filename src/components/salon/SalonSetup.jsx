import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { COLORS } from '../../constants/dashboard';

const SalonSetup = ({ onComplete }) => {
  const { createOrUpdateSalon, loading, error: contextError } = useSalon();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!formData.name.trim()) {
      setSubmitError('O nome do salão é obrigatório');
      return;
    }

    try {
      // 1. Criamos o salão usando a função do contexto
      await createOrUpdateSalon(formData);
      
      // 2. Chamamos o callback que avisará o Dashboard para recarregar
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      setSubmitError(err.message || 'Erro ao salvar salão. Tente novamente.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      padding: '20px 0', // Removido minHeight 100vh para encaixar no Dashboard
    }}>
      <div style={{
        backgroundColor: COLORS.white,
        borderRadius: '16px', // Bordas um pouco mais arredondadas
        padding: '40px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)', // Sombra mais suave e moderna
        maxWidth: '500px',
        width: '100%'
      }}>
        <h2 style={{ color: COLORS.deepCharcoal, marginBottom: '10px', textAlign: 'center' }}>
          👋 Bem-vindo ao Cronos!
        </h2>
        
        <p style={{
          color: COLORS.deepCharcoal,
          marginBottom: '30px',
          textAlign: 'center',
          opacity: 0.8,
          fontSize: '15px'
        }}>
          Para começar, vamos configurar seu salão. 
          Digite as informações básicas abaixo.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Input de Nome */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Nome do Salão *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Studio Beauty, Barbearia Estilo"
              style={inputStyle}
              required
              autoFocus
            />
          </div>

          {/* Input de Telefone */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Telefone de Contato</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
              style={inputStyle}
            />
          </div>

          {/* Input de Endereço */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Endereço Completo</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Rua, número, bairro..."
              style={inputStyle}
            />
          </div>

          {(submitError || contextError) && (
            <div style={{
              color: '#b91c1c',
              backgroundColor: '#fef2f2',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              textAlign: 'center',
              border: '1px solid #fecaca'
            }}>
              <strong>Ops!</strong> {submitError || contextError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: COLORS.sageGreen,
              color: COLORS.white,
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(163, 177, 138, 0.3)'
            }}
          >
            {loading ? 'Configurando...' : 'Finalizar Configuração'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Estilos auxiliares para manter o código limpo
const inputGroupStyle = { marginBottom: '20px' };
const labelStyle = { display: 'block', marginBottom: '8px', color: COLORS.deepCharcoal, fontWeight: '600', fontSize: '14px' };
const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  border: `1px solid ${COLORS.warmSand}`,
  borderRadius: '8px',
  fontSize: '16px',
  color: COLORS.deepCharcoal,
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s'
};

export default SalonSetup;