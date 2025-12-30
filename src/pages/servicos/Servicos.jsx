import React from "react";
import { useNavigate } from "react-router-dom";
import { useSalon } from "../../context/SalonContext";
import ServicesSection from "../../components/ServicesSection";
import { COLORS } from "../../constants/dashboard";
import BackButton from "../../components/ui/BackButton";

export default function Servicos() {
  const navigate = useNavigate();
  const { salon, services, setServices, loading, error } = useSalon();

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Carregando serviços...</div>;
  if (error) return <div style={{ padding: 40, color: "red", textAlign: "center" }}>{error}</div>;

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: "100vh", paddingBottom: "40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        
        {/* Botão Voltar Estilizado */}
        <BackButton colors={COLORS} />

        <h2 style={{ marginBottom: "20px", color: COLORS.deepCharcoal }}>
          Gestão de Serviços: {salon?.name}
        </h2>

        <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <ServicesSection
            services={services}
            setServices={setServices}
            salonId={salon?.id}
            colors={COLORS}
          />
        </div>
      </div>
    </div>
  );
}