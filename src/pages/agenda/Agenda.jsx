import React, { useState, useEffect, useCallback } from "react";
import { useSalon } from "../../context/SalonContext";
import { supabase } from "../../lib/supabase"; 
import ProfessionalCalendar from "../../components/ProfessionalCalendar";
import BackButton from "../../components/ui/BackButton";
import { COLORS } from "../../constants/dashboard";

export default function Agenda() {
  const { salon, professionals } = useSalon();
  const [selectedProfId, setSelectedProfId] = useState("all");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAgendaData = useCallback(async () => {
    if (!professionals || professionals.length === 0) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('slots')
        .select('*, services(name)')
        .in('professional_id', professionals.map(p => p.id));

      if (error) throw error;
      setSlots(data || []);
    } catch (err) {
      console.error("Erro ao carregar agenda:", err);
    } finally {
      setLoading(false);
    }
  }, [professionals]);

  useEffect(() => {
    loadAgendaData();
  }, [loadAgendaData]);

  // Filtra os slots com base no profissional selecionado
  const filteredSlots = selectedProfId === "all" 
    ? slots 
    : slots.filter(s => s.professional_id === selectedProfId);

  // Filtra a lista de profissionais para exibir apenas o selecionado (ou todos)
  const displayedProfessionals = selectedProfId === "all"
    ? professionals
    : professionals.filter(p => p.id === selectedProfId);

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <BackButton colors={COLORS} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: "20px 0" }}>
          <h2 style={{ color: COLORS.deepCharcoal, margin: 0 }}>
            Agenda: {salon?.name || "Carregando..."}
          </h2>
          
          {/* FILTRO DE PROFISSIONAL */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontWeight: '500' }}>Filtrar por:</label>
            <select 
              value={selectedProfId} 
              onChange={(e) => setSelectedProfId(e.target.value)}
              style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${COLORS.sageGreen}` }}
            >
              <option value="all">Todos os Profissionais</option>
              {professionals?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Carregando...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {displayedProfessionals?.map(pro => (
              <div key={pro.id} style={{ 
                backgroundColor: 'white', 
                padding: '20px', 
                borderRadius: '16px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
              }}>
                <h3 style={{ marginBottom: '15px', color: COLORS.deepCharcoal }}>
                  Agenda de {pro.name}
                </h3>
                <ProfessionalCalendar
                  slots={slots.filter(s => s.professional_id === pro.id)}
                  handleDeleteSlot={async (id) => {
                    if(!window.confirm("Excluir agendamento?")) return;
                    await supabase.from('slots').delete().eq('id', id);
                    loadAgendaData();
                  }}
                  handleMoveSlot={async ({ slotId, newStart, newEnd }) => {
                    await supabase.from('slots')
                      .update({ 
                        start_time: newStart.toISOString(),
                        end_time: newEnd.toISOString() 
                      })
                      .eq('id', slotId);
                    loadAgendaData();
                  }}
                  // Passamos o horário de funcionamento do salão para o min/max
                  openingTime={salon?.opening_time}
                  closingTime={salon?.closing_time}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}