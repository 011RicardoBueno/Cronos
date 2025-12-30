import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ colors, destination = "/" }) => {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate(destination)} 
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "white",
        border: `1px solid ${colors.warmSand}`,
        color: colors.deepCharcoal,
        cursor: "pointer",
        marginBottom: "20px",
        padding: "8px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "600",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.warmSand;
        e.currentTarget.style.transform = "translateX(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "white";
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      <span style={{ fontSize: "18px" }}>←</span> 
      Voltar para o Painel
    </button>
  );
};

export default BackButton;
