// hooks/useDashboardData.js
import { useState, useCallback, useEffect } from 'react';
import { fetchSalonData, fetchServicesAndProfessionals } from '../services/supabaseService';
import { validateProfessionalExists } from '../utils/dashboardUtils';

export const useDashboardData = (session, selectedProfessionalId) => {
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
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
        // Retornar callback para atualizar o ID
        return { shouldUpdateProfessionalId: true };
      }
      
      return { shouldUpdateProfessionalId: false };
    } catch (err) {
      setError(err.message || "Erro ao carregar dados");
      return { shouldUpdateProfessionalId: false };
    } finally {
      setLoading(false);
    }
  }, [session, selectedProfessionalId]);

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
