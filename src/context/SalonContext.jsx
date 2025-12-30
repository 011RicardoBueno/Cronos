import React, { createContext, useContext, useState, useEffect } from 'react';
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

const loadSalonData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setLoading(false);
        return;
      }

      // GARANTIA: Se for cliente, limpa estados de salão e interrompe o setup
      const userRole = user.user_metadata?.role;
      if (userRole === 'client') {
        setSalon(null);
        setNeedsSetup(false); // Impede a abertura do modal/página de setup
        setLoading(false);
        return;
      }

      // Se chegou aqui, é admin...
      console.log('Buscando dados para o dono do salão:', user.id);

      // ALTERAÇÃO: Buscamos pela coluna 'owner_id' (ID do usuário)
      // Certifique-se de que essa coluna existe na sua tabela 'salons' no Supabase
      const { data: salonsData, error: salonsError } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', user.id) // Busca vinculada ao ID do usuário
        .maybeSingle();

      if (salonsError) throw salonsError;

      if (!salonsData) {
        console.log('Usuário admin não tem salão cadastrado');
        setNeedsSetup(true);
        setLoading(false);
        return;
      }

      // Se encontrou salão, busca dados relacionados
      const salonId = salonsData.id;
      
      const [professionalsRes, servicesRes] = await Promise.all([
        supabase.from('professionals').select('*').eq('salon_id', salonId),
        supabase.from('services').select('*').eq('salon_id', salonId)
      ]);

      setSalon(salonsData);
      setProfessionals(professionalsRes.data || []);
      setServices(servicesRes.data || []);
      setNeedsSetup(false);

    } catch (err) {
      console.error('Erro ao carregar dados do contexto:', err);
      setError(err.message);
      // Se der erro de coluna inexistente, avisamos o dev
      if (err.code === '42703') {
        console.error("DICA: Adicione a coluna 'owner_id' (tipo UUID) na sua tabela 'salons' no Supabase.");
      }
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateSalon = async (salonData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) throw new Error('Usuário não autenticado');

      // Limpeza explícita dos dados para evitar enviar colunas que não existem (como o email)
      const cleanData = {
        name: salonData.name,
        phone: salonData.phone,
        address: salonData.address,
      };

      // Se já tem salão, atualiza
      if (salon?.id) {
        const { data, error } = await supabase
          .from('salons')
          .update(cleanData) // Enviando apenas os campos limpos
          .eq('id', salon.id)
          .select()
          .single();

        if (error) throw error;
        setSalon(data);
        return data;
      } 
      // Se não tem, cria novo vinculando ao owner_id
      else {
        const newSalonEntry = {
          ...cleanData, // Usa os campos limpos (sem email)
          owner_id: user.id,
        };

        console.log('Tentando inserir:', newSalonEntry);

        const { data: newSalon, error: salonError } = await supabase
          .from('salons')
          .insert([newSalonEntry])
          .select()
          .single();

        if (salonError) {
          console.error('Erro detalhado do Supabase:', salonError);
          throw salonError;
        }

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

  const refreshSalon = () => loadSalonData();

  useEffect(() => {
    if (user) {
      loadSalonData();
    } else {
      setSalon(null);
      setLoading(false);
    }
  }, [user]);

  const value = {
    salon, services, setServices, professionals,
    loading, error, needsSetup, createOrUpdateSalon, refreshSalon
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