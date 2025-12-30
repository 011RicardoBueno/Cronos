import React from 'react';
import { COLORS } from '../../constants/dashboard';
import BackButton from '../../components/ui/BackButton';

const Profissionais = () => {
  return (
    <div style={{ 
      backgroundColor: COLORS.offWhite, 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <BackButton />
        
        <h1 style={{ 
          color: COLORS.deepCharcoal, 
          marginBottom: '30px',
          marginTop: '20px'
        }}>
          👥 Profissionais
        </h1>
        
        <div style={{
          backgroundColor: COLORS.white,
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <p style={{ color: COLORS.deepCharcoal }}>
            Página de Profissionais - Em desenvolvimento
          </p>
          <p style={{ color: COLORS.deepCharcoal, marginTop: '20px' }}>
            Aqui você poderá gerenciar a equipe de profissionais do salão.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profissionais;
