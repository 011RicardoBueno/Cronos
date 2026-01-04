// hooks/useDashboardData.js
import { useState, useCallback, useEffect } from 'react';
import { useSalon } from '@/context/SalonContext';
import { fetchServicesAndProfessionals } from '@/services/supabaseService';
import { validateProfessionalExists } from '@/utils/dashboardUtils';

export const useDashboardData = (selectedProfessionalId) => {
  const { salon } = useSalon();
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!salon?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      // Buscar serviços e profissionais
      const { servicesRes, professionalsRes } = await fetchServicesAndProfessionals(salon.id);
      
      if (servicesRes.error) throw servicesRes.error;
      if (professionalsRes.error) throw professionalsRes.error;

      const professionalsData = professionalsRes.data || [];
      const servicesData = servicesRes.data || [];

      setServices(servicesData);
      setProfessionals(professionalsData);

      // Validar selectedProfessionalId
      if (!validateProfessionalExists(professionalsData, selectedProfessionalId)) {
        return { shouldUpdateProfessionalId: true };
      }
      
      return { shouldUpdateProfessionalId: false };
    } catch (err) {
      setError(err.message || "Erro ao carregar dados");
      return { shouldUpdateProfessionalId: false };
    } finally {
      setLoading(false);
    }
  }, [salon?.id, selectedProfessionalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    salon,
    services,
    setServices, // Adicionado para permitir edição de serviços
    professionals,
    setProfessionals, // Adicionado (útil caso precise atualizar localmente)
    loading,
    error,
    loadData
  };
};
