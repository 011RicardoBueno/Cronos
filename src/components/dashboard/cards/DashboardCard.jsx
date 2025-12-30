import React from 'react';
// Importamos as cores para garantir que o card funcione mesmo sem props
import { COLORS } from '../../../constants/dashboard';

export default function DashboardCard({ title, description, icon, onClick, accentColor }) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        backgroundColor: '#FFFFFF', // Cor fixa para evitar erro de undefined
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        borderTop: `4px solid ${accentColor || COLORS.sageGreen}`, // Barra de cor no topo
        gap: '12px'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
      }}
    >
      {/* Renderização do Ícone */}
      {icon && (
        <div style={{ 
          color: accentColor || COLORS.sageGreen, 
          backgroundColor: `${accentColor || COLORS.sageGreen}15`, // Cor com 15% de opacidade
          padding: '10px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
      )}

      <div>
        <h3 style={{ 
          color: COLORS.deepCharcoal, 
          margin: '0 0 4px 0', 
          fontSize: '1.2rem',
          fontWeight: '600'
        }}>
          {title}
        </h3>
        <p style={{ 
          color: '#666', 
          margin: 0,
          fontSize: '0.9rem',
          lineHeight: '1.4'
        }}>
          {description}
        </p>
      </div>
    </div>
  );
}