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
      await createOrUpdateSalon(formData);
      if (onComplete) onComplete();
    } catch (err) {
      setSubmitError(err.message || 'Erro ao salvar salão. Tente novamente.');
    }
  };

  // Definição dos estilos dentro do componente para garantir consistência
  const labelStyle = { 
    display: 'block', 
    marginBottom: '8px', 
    color: COLORS.deepCharcoal, 
    fontWeight: '500', 
    fontSize: '14px' 
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: `1px solid ${COLORS.dustyRose}`, // Mesma borda da Login
    borderRadius: '8px',
    fontSize: '16px',
    color: COLORS.deepCharcoal,
    backgroundColor: COLORS.offWhite, // Força o fundo claro igual ao Login
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      padding: '40px 0',
    }}>
      <div style={{
        backgroundColor: COLORS.white,
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)', // Sombra igual ao Login
        maxWidth: '480px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ color: COLORS.deepCharcoal, fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            👋 Bem-vindo ao Cronos!
          </h2>
          <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.5' }}>
            Para começar, vamos configurar seu salão.<br/> 
            Digite as informações básicas abaixo.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Campo Nome */}
          <div style={{ marginBottom: '24px' }}>
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

          {/* Campo Telefone */}
          <div style={{ marginBottom: '24px' }}>
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

          {/* Campo Endereço */}
          <div style={{ marginBottom: '32px' }}>
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
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px',
              border: '1px solid #fee2e2',
              textAlign: 'center'
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
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(163, 177, 138, 0.3)'
            }}
          >
            {loading ? 'Processando...' : 'Finalizar Configuração'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SalonSetup;