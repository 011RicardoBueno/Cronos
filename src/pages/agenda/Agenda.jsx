import React, { useState, useEffect, useCallback } from "react";
import { useSalon } from "../../context/SalonContext";
// Ajustado para o caminho correto segundo sua árvore
import { supabase } from "../../lib/supabase"; 
import ProfessionalCalendar from "../../components/ProfessionalCalendar";
import BackButton from "../../components/ui/BackButton";
import { COLORS } from "../../constants/dashboard";

export default function Agenda() {
  const { salon, professionals } = useSalon();
  const [slotsByProfessional, setSlotsByProfessional] = useState({});
  const [loading, setLoading] = useState(true);

  const loadAgendaData = useCallback(async () => {
    // Verificação de segurança para evitar loops ou erros de undefined
    if (!professionals || professionals.length === 0) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const profIds = professionals.map(p => p.id);
      
      // Buscamos os slots e o nome do serviço associado
      const { data, error } = await supabase
        .from('slots')
        .select(`
          *,
          services (name)
        `)
        .in('professional_id', profIds);

      if (error) throw error;

      // Organizamos o mapa de profissionais
      const map = {};
      professionals.forEach(p => { map[p.id] = []; });
      
      data?.forEach(slot => {
        if (map[slot.professional_id]) {
          map[slot.professional_id].push(slot);
        }
      });
      
      setSlotsByProfessional(map);
    } catch (err) {
      console.error("Erro ao carregar agenda:", err);
    } finally {
      setLoading(false);
    }
  }, [professionals]);

  useEffect(() => {
    loadAgendaData();
  }, [loadAgendaData]);

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <BackButton colors={COLORS} />
        <h2 style={{ color: COLORS.deepCharcoal, margin: "20px 0" }}>
          Agenda: {salon?.name || "Carregando..."}
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Carregando agendamentos...</div>
        ) : professionals?.length > 0 ? (
          professionals.map(pro => (
            <div key={pro.id} style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '16px', 
              marginBottom: '30px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
            }}>
              <h3 style={{ marginBottom: '15px', color: COLORS.deepCharcoal }}>
                Profissional: {pro.name}
              </h3>
              <ProfessionalCalendar
                slots={slotsByProfessional[pro.id] || []}
                handleDeleteSlot={async (id) => {
                  if(!window.confirm("Deseja excluir este agendamento?")) return;
                  await supabase.from('slots').delete().eq('id', id);
                  loadAgendaData(); // Recarrega os dados após deletar
                }}
              />
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center' }}>Nenhum profissional encontrado.</p>
        )}
      </div>
    </div>
  );
}