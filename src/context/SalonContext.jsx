import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const SalonContext = createContext();

export const SalonProvider = ({ children }) => {
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  const { user } = useAuth();

  // Usamos useCallback para que a função possa ser usada em useEffects sem loops
  const loadSalonData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setSalon(null);
        setProfessionals([]);
        setServices([]);
        setLoading(false);
        return;
      }

      const userRole = user.user_metadata?.role;
      
      // Se for cliente, não carregamos dados de gerência de salão
      if (userRole === 'client') {
        setSalon(null);
        setNeedsSetup(false);
        setLoading(false);
        return;
      }

      // Busca o salão vinculado ao dono (owner_id)
      const { data: salonsData, error: salonsError } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (salonsError) throw salonsError;

      if (!salonsData) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }

      const salonId = salonsData.id;
      
      // Carregamento paralelo para performance
      const [professionalsRes, servicesRes] = await Promise.all([
        supabase.from('professionals').select('*').eq('salon_id', salonId).order('name'),
        supabase.from('services').select('*').eq('salon_id', salonId).order('name')
      ]);

      if (professionalsRes.error) throw professionalsRes.error;
      if (servicesRes.error) throw servicesRes.error;

      setSalon(salonsData);
      setProfessionals(professionalsRes.data || []);
      setServices(servicesRes.data || []);
      setNeedsSetup(false);

    } catch (err) {
      console.error('Erro no SalonContext:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createOrUpdateSalon = async (salonData) => {
    try {
      setLoading(true);
      if (!user) throw new Error('Usuário não autenticado');

      // Sanitização de dados para o Postgres
      const cleanData = {
        name: salonData.name,
        phone: salonData.phone,
        address: salonData.address,
        opening_time: salonData.opening_time,
        closing_time: salonData.closing_time,
      };

      if (salon?.id) {
        const { data, error } = await supabase
          .from('salons')
          .update(cleanData)
          .eq('id', salon.id)
          .select()
          .single();

        if (error) throw error;
        setSalon(data);
        return data;
      } else {
        const { data: newSalon, error: salonError } = await supabase
          .from('salons')
          .insert([{ ...cleanData, owner_id: user.id }])
          .select()
          .single();

        if (salonError) throw salonError;
        await loadSalonData(); 
        return newSalon;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalonData();
  }, [loadSalonData]);

  const value = {
    salon, 
    services, 
    setServices, 
    professionals,
    setProfessionals, // Adicionado para permitir atualizações locais rápidas
    loading, 
    error, 
    needsSetup, 
    createOrUpdateSalon, 
    refreshSalon: loadSalonData
  };

  return (
    <SalonContext.Provider value={value}>
      {children}
    </SalonContext.Provider>
  );
};

export const useSalon = () => {
  const context = useContext(SalonContext);
  if (!context) throw new Error('useSalon deve ser usado dentro de SalonProvider');
  return context;
};