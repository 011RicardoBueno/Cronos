import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const SalonContext = createContext();

export const SalonProvider = ({ children }) => {
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]); // ADICIONADO
  const [professionals, setProfessionals] = useState([]); // ADICIONADO
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  const { user } = useAuth();

  const loadSalonData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Buscar salon_id do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('salon_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.salon_id) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }

      // 2. Buscar dados do salão, profissionais e serviços em paralelo
      const [salonRes, professionalsRes, servicesRes] = await Promise.all([
        supabase.from('salons').select('*').eq('id', userData.salon_id).single(),
        supabase.from('professionals').select('*').eq('salon_id', userData.salon_id),
        supabase.from('services').select('*').eq('salon_id', userData.salon_id)
      ]);

      if (salonRes.error) throw salonRes.error;

      setSalon(salonRes.data);
      setProfessionals(professionalsRes.data || []); // Garante que seja array
      setServices(servicesRes.data || []); // Garante que seja array
      setNeedsSetup(false);

    } catch (err) {
      console.error('Erro ao carregar dados do contexto:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshSalon = () => loadSalonData();

  useEffect(() => {
    if (user) loadSalonData();
    else setLoading(false);
  }, [user]);

  const value = {
    salon,
    services,       // DISPONIBILIZADO
    setServices,    // DISPONIBILIZADO
    professionals, // DISPONIBILIZADO
    loading,
    error,
    needsSetup,
    refreshSalon
  };

  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>;
};

export const useSalon = () => {
  const context = useContext(SalonContext);
  if (!context) throw new Error('useSalon deve ser usado dentro de SalonProvider');
  return context;
};