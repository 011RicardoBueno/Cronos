import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchSalonData, fetchServicesAndProfessionals } from '../services/supabaseService';

const SalonContext = createContext();

export const SalonProvider = ({ children, session }) => {
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAllData = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      // 1. Dados do Salão
      const userData = await fetchSalonData(session.user.id);
      if (!userData?.salons) throw new Error("Salão não encontrado");
      
      const salonData = userData.salons;
      setSalon(salonData);

      // 2. Serviços e Profissionais
      const { servicesRes, professionalsRes } = await fetchServicesAndProfessionals(salonData.id);
      
      setServices(servicesRes.data || []);
      setProfessionals(professionalsRes.data || []);
      setError(null);
    } catch (err) {
      console.error("Erro no Contexto:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <SalonContext.Provider value={{ 
      salon, services, setServices, professionals, loading, error, refreshData: loadAllData 
    }}>
      {children}
    </SalonContext.Provider>
  );
};

export const useSalon = () => {
  const context = useContext(SalonContext);
  if (!context) throw new Error("useSalon deve ser usado dentro de um SalonProvider");
  return context;
};
