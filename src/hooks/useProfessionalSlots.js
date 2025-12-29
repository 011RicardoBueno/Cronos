// hooks/useProfessionalSlots.js
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
        slotsMap[pro.id] = slotsResults[idx] || [];
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
        s.id === slotId ? { ...s, time: newTime } : s
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
