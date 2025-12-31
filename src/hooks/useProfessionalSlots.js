import { useState, useCallback } from 'react';
import { fetchProfessionalSlots } from '../services/supabaseService';

export const useProfessionalSlots = () => {
  const [slotsByProfessional, setSlotsByProfessional] = useState({});
  const [loadingSlots, setLoadingSlots] = useState({});

  /**
   * @param {Array} professionals - Lista de objetos de profissionais
   * @param {String} startDate - Data inicial em formato ISO ou YYYY-MM-DD
   * @param {String} endDate - Data final em formato ISO ou YYYY-MM-DD
   */
  const loadProfessionalSlots = useCallback(async (professionals, startDate = null, endDate = null) => {
    if (!professionals || professionals.length === 0) return;

    // Sinaliza loading para cada profissional específico
    setLoadingSlots(prev => {
      const newLoading = { ...prev };
      professionals.forEach(pro => { newLoading[pro.id] = true; });
      return newLoading;
    });

    try {
      // Promise.allSettled garante que se um profissional falhar, os outros carregam
      const results = await Promise.allSettled(
        professionals.map(pro => fetchProfessionalSlots(pro.id, startDate, endDate))
      );
      
      const slotsUpdates = {};

      results.forEach((result, idx) => {
        const proId = professionals[idx].id;
        
        if (result.status === 'fulfilled') {
          const rawSlots = result.value || [];
          
          slotsUpdates[proId] = rawSlots.map(slot => {
            const actualTime = slot.start_time || slot.time;
            return {
              ...slot,
              time: actualTime, // Compatibilidade com componentes antigos
              start_time: actualTime,
              professionalId: slot.professional_id || proId 
            };
          });
        } else {
          console.error(`Falha ao carregar slots do profissional ${proId}:`, result.reason);
          slotsUpdates[proId] = []; // Evita undefined em caso de erro
        }
      });
      
      // Atualiza o estado fundindo os novos slots com os existentes
      setSlotsByProfessional(prev => ({
        ...prev,
        ...slotsUpdates
      }));

    } catch (error) {
      console.error('Erro geral no carregamento de slots:', error);
    } finally {
      // Desativa o loading
      setLoadingSlots(prev => {
        const newLoading = { ...prev };
        professionals.forEach(pro => { newLoading[pro.id] = false; });
        return newLoading;
      });
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