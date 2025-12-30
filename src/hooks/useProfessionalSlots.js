import { useState, useCallback } from 'react';
import { fetchProfessionalSlots } from '../services/supabaseService';

export const useProfessionalSlots = () => {
  const [slotsByProfessional, setSlotsByProfessional] = useState({});
  const [loadingSlots, setLoadingSlots] = useState({});

  const loadProfessionalSlots = useCallback(async (professionals) => {
    if (!professionals || professionals.length === 0) return;

    setLoadingSlots(prev => ({
      ...prev,
      ...professionals.reduce((acc, pro) => ({ ...acc, [pro.id]: true }), {})
    }));

    try {
      const slotsPromises = professionals.map(pro =>
        fetchProfessionalSlots(pro.id)
      );
      
      const slotsResults = await Promise.all(slotsPromises);
      
      const slotsMap = {};
      professionals.forEach((pro, idx) => {
        const rawSlots = slotsResults[idx] || [];
        
        // Mapeamento aprimorado para garantir compatibilidade visual
        slotsMap[pro.id] = rawSlots.map(slot => {
          // Prioriza start_time (formato novo) mas aceita time (formato antigo)
          const actualTime = slot.start_time || slot.time;
          
          return {
            ...slot,
            // O componente de agenda geralmente precisa da prop 'time'
            time: actualTime, 
            start_time: actualTime,
            // Garante que o ID do profissional esteja presente no objeto do slot
            professionalId: slot.professional_id || pro.id 
          };
        });
      });
      
      setSlotsByProfessional(slotsMap);
    } catch (error) {
      console.error('Erro ao carregar slots:', error);
    } finally {
      setLoadingSlots(prev => ({
        ...prev,
        ...professionals.reduce((acc, pro) => ({ ...acc, [pro.id]: false }), {})
      }));
    }
  }, []);

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
        // Atualizamos todas as referências de tempo para manter a consistência
        s.id === slotId ? { ...s, time: newTime, start_time: newTime } : s
      ) || []
    }));
  }, []);

  return {
    slotsByProfessional,
    loadingSlots,
    loadProfessionalSlots,
    updateSlotsAfterDelete,
    updateSlotsAfterMove,
    setSlotsByProfessional
  };
};