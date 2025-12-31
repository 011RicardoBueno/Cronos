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
      
      if (userRole === 'client') {
        setSalon(null);
        setNeedsSetup(false);
        setLoading(false);
        return;
      }

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
      setError(null);
      if (!user) throw new Error('Usuário não autenticado');

      const cleanData = {
        name: salonData.name,
        phone: salonData.phone,
        address: salonData.address,
        owner_id: user.id,
        cep: salonData.cep || null,
        slug: salonData.slug || null,
        opening_time: salonData.opening_time || '08:00',
        closing_time: salonData.closing_time || '19:00',
      };

      if (salon?.id) {
        // UPDATE
        const { data, error: updateError } = await supabase
          .from('salons')
          .update(cleanData)
          .eq('id', salon.id)
          .select()
          .single();

        if (updateError) throw updateError;
        
        setSalon(data);
        return data;
      } else {
        // INSERT
        const { data: newSalon, error: insertError } = await supabase
          .from('salons')
          .insert([cleanData])
          .select()
          .single();

        if (insertError) {
          // Tratamento amigável para link duplicado
          if (insertError.code === '23505') throw new Error('Este link (URL) já está em uso por outro salão.');
          throw insertError;
        }
        
        // --- PATCH DE SINCRONIZAÇÃO IMEDIATA ---
        setSalon(newSalon);
        setNeedsSetup(false); // Libera o acesso ao dashboard instantaneamente
        setError(null);
        // ---------------------------------------

        // Carrega profissionais e serviços (que virão vazios, mas inicializa o estado)
        await loadSalonData(); 
        
        return newSalon;
      }
    } catch (err) {
      console.error("Erro detalhado no salvamento:", err);
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
    setProfessionals,
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