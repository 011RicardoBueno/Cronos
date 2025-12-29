// pages/DashboardOptimized.jsx
import { useDashboardData } from '../hooks/useDashboardData';
import { useProfessionalSlots } from '../hooks/useProfessionalSlots';
import { useProfessionalFilter } from '../hooks/useProfessionalFilter';
import { deleteSlot, updateSlotTime } from '../services/supabaseService';
import { getTodaySlotsCount } from '../utils/dashboardUtils';
import { COLORS, UPCOMING_FEATURES } from '../constants/dashboard';

import DashboardHeader from '../components/layout/DashboardHeader';
import ProfessionalsSection from '../components/ProfessionalsSection';
import ServicesSection from '../components/ServicesSection';

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

export default function DashboardOptimized({ session }) {
  // Gerenciar filtro de profissional
  const {
    selectedProfessionalId,
    setSelectedProfessionalId,
    updateUrlAndStorage
  } = useProfessionalFilter("all");

  // Carregar dados principais
  const {
    salon,
    services,
    professionals,
    loading,
    error,
    loadData
  } = useDashboardData(session, selectedProfessionalId);

  // Gerenciar slots
  const {
    slotsByProfessional,
    loadingSlots,
    loadProfessionalSlots,
    updateSlotsAfterDelete,
    updateSlotsAfterMove,
    setSlotsByProfessional
  } = useProfessionalSlots();

  // Carregar slots quando profissionais mudarem
  useEffect(() => {
    if (professionals.length > 0) {
      loadProfessionalSlots(professionals);
    }
  }, [professionals, loadProfessionalSlots]);

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
          loadDashboardData={loadData}
          handleDeleteSlot={handleDeleteSlot}
          handleMoveSlot={handleMoveSlot}
          colors={COLORS}
          loadingSlots={loadingSlots}
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
