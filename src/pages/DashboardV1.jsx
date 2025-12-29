import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

// Importações de constantes e utilitários
import {
  STORAGE_KEY,
  URL_PARAM_KEY,
  COLORS,
  UPCOMING_FEATURES
} from "../constants/dashboard";
import {
  getProfessionalFromURL,
  getTodaySlotsCount,
  validateProfessionalExists
} from "../utils/dashboardUtils";
import {
  fetchSalonData,
  fetchServicesAndProfessionals,
  fetchProfessionalSlots,
  deleteSlot,
  updateSlotTime
} from "../services/supabaseService";

import DashboardHeader from "../components/layout/DashboardHeader";
import ProfessionalsSection from "../components/ProfessionalsSection";
import ServicesSection from "../components/ServicesSection";

// Componentes de estado
const LoadingState = () => (
  <div style={{ padding: 40, textAlign: "center" }}>
    Carregando painel...
  </div>
);

const ErrorState = ({ message }) => (
  <div style={{ padding: 40, textAlign: "center", color: "red" }}>
    {message}
  </div>
);

export default function Dashboard({ session }) {
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [slotsByProfessional, setSlotsByProfessional] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(() => {
    const fromURL = getProfessionalFromURL();
    return fromURL || localStorage.getItem(STORAGE_KEY) || "all";
  });

  // Funções de atualização de slots
  const updateSlotsAfterDelete = useCallback((profId, slotId) => {
    setSlotsByProfessional(prev => ({
      ...prev,
      [profId]: prev[profId]?.filter(s => s.id !== slotId) || []
    }));
  }, []);

  const updateSlotsAfterMove = useCallback((professionalId, slotId, newTime) => {
    setSlotsByProfessional(prev => ({
      ...prev,
      [professionalId]: prev[professionalId]?.map(s => 
        s.id === slotId ? { ...s, time: newTime } : s
      ) || []
    }));
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);

    try {
      // Buscar dados do salão
      const userData = await fetchSalonData(session.user.id);
      
      if (!userData?.salons) {
        throw new Error("Salão não encontrado");
      }
      
      setSalon(userData.salons);

      // Buscar serviços e profissionais
      const { servicesRes, professionalsRes } = await fetchServicesAndProfessionals(userData.salons.id);
      
      if (servicesRes.error) throw servicesRes.error;
      if (professionalsRes.error) throw professionalsRes.error;

      const professionalsData = professionalsRes.data || [];
      const servicesData = servicesRes.data || [];
      
      setServices(servicesData);
      setProfessionals(professionalsData);

      // Validar selectedProfessionalId
      if (!validateProfessionalExists(professionalsData, selectedProfessionalId)) {
        setSelectedProfessionalId("all");
      }

      // Buscar slots de cada profissional
      const slotsPromises = professionalsData.map(pro =>
        fetchProfessionalSlots(pro.id)
      );
      
      const slotsResults = await Promise.all(slotsPromises);
      
      const slotsMap = {};
      professionalsData.forEach((pro, idx) => {
        slotsMap[pro.id] = slotsResults[idx] || [];
      });
      
      setSlotsByProfessional(slotsMap);
    } catch (err) {
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [session, selectedProfessionalId]);

  // Efeito para carregar dados
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      await loadDashboardData();
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [loadDashboardData]);

  // Efeito para sincronizar URL e localStorage
  useEffect(() => {
    if (!selectedProfessionalId) return;
    
    localStorage.setItem(STORAGE_KEY, selectedProfessionalId);
    
    const params = new URLSearchParams(window.location.search);
    if (selectedProfessionalId === "all") {
      params.delete(URL_PARAM_KEY);
    } else {
      params.set(URL_PARAM_KEY, selectedProfessionalId);
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", newUrl);
  }, [selectedProfessionalId]);

  // Funções de manipulação de slots
  const handleDeleteSlot = async (slotId, profId) => {
    if (!window.confirm("Deseja realmente cancelar este agendamento?")) return;
    
    try {
      await deleteSlot(slotId);
      updateSlotsAfterDelete(profId, slotId);
    } catch (err) {
      alert("Erro ao cancelar: " + err.message);
    }
  };

  const handleMoveSlot = async ({ slotId, professionalId, newStart }) => {
    try {
      await updateSlotTime(slotId, newStart);
      updateSlotsAfterMove(professionalId, slotId, newStart.toISOString());
    } catch (err) {
      alert("Erro ao mover agendamento: " + err.message);
    }
  };

  // Calcular contagem de slots do dia
  const todaySlotsCount = getTodaySlotsCount(slotsByProfessional);

  // Estados de loading e erro
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!salon) return <div style={{ padding: 40 }}>Salão não encontrado</div>;

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: "100vh", paddingBottom: "40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        
        <DashboardHeader
          salonName={salon.name}
          todaySlotsCount={todaySlotsCount}
          colors={COLORS}
          selectedProfessionalId={selectedProfessionalId}
          setSelectedProfessionalId={setSelectedProfessionalId}
          professionals={professionals}
          upcomingFeatures={UPCOMING_FEATURES}
        />

        <ProfessionalsSection
          professionals={professionals}
          selectedProfessionalId={selectedProfessionalId}
          setSelectedProfessionalId={setSelectedProfessionalId}
          services={services}
          slotsByProfessional={slotsByProfessional}
          setSlotsByProfessional={setSlotsByProfessional}
          loadDashboardData={loadDashboardData}
          handleDeleteSlot={handleDeleteSlot}
          handleMoveSlot={handleMoveSlot}
          colors={COLORS}
        />

        <ServicesSection
          services={services}
          setServices={setServices}
          salonId={salon.id}
          colors={COLORS}
        />
      </div>
    </div>
  );
}
