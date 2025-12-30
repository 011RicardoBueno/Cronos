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
        console.log('Nenhum usuário disponível');
        setLoading(false);
        return;
      }

      console.log('Buscando dados para usuário:', user.id);

      // OPÇÃO A: Se você CRIOU a tabela public.users
      const { data: userData, error: userError } = await supabase
        .from('public.users')  // Especifique o schema
        .select('salon_id')
        .eq('id', user.id)
        .single();

      // OPÇÃO B: Se NÃO criou a tabela, use uma lógica alternativa
      // Primeiro, tenta buscar salões vinculados ao email do usuário
      const { data: salonsData, error: salonsError } = await supabase
        .from('salons')
        .select('*')
        .eq('email', user.email)  // Busca por email
        .single();

      if (salonsError || !salonsData) {
        console.log('Usuário não tem salão cadastrado');
        setNeedsSetup(true);
        setLoading(false);
        return;
      }

      // Se encontrou salão pelo email
      const salonId = salonsData.id;
      
      // Busca dados relacionados
      const [professionalsRes, servicesRes] = await Promise.all([
        supabase.from('professionals').select('*').eq('salon_id', salonId),
        supabase.from('services').select('*').eq('salon_id', salonId)
      ]);

      setSalon(salonsData);
      setProfessionals(professionalsRes.data || []);
      setServices(servicesRes.data || []);
      setNeedsSetup(false);
      console.log('Dados carregados com sucesso');

    } catch (err) {
      console.error('Erro ao carregar dados do contexto:', err);
      setError(err.message);
      setNeedsSetup(true); // Se erro, assume que precisa de setup
    } finally {
      setLoading(false);
    }
  };

  // Função para criar salão (para o SalonSetup)
  const createOrUpdateSalon = async (salonData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Criando/atualizando salão para:', user.email);

      // Se já tem salão, atualiza
      if (salon?.id) {
        const { data, error } = await supabase
          .from('salons')
          .update(salonData)
          .eq('id', salon.id)
          .select()
          .single();

        if (error) throw error;
        setSalon(data);
        return data;
      } 
      // Se não tem, cria novo
      else {
        // Adiciona email do usuário ao salão
        const salonWithEmail = {
          ...salonData,
          email: user.email
        };

        const { data: newSalon, error: salonError } = await supabase
          .from('salons')
          .insert([salonWithEmail])
          .select()
          .single();

        if (salonError) throw salonError;

        console.log('Salão criado:', newSalon.name);

        // Se quiser criar registro na tabela users (opcional)
        try {
          // Verifica se tabela users existe
          const { error: checkError } = await supabase
            .from('users')
            .select('id')
            .limit(1);

          if (!checkError) {
            // Tabela existe, cria/atualiza registro
            const { error: userError } = await supabase
              .from('users')
              .upsert({
                id: user.id,
                salon_id: newSalon.id
              });

            if (userError) console.warn('Não foi possível atualizar tabela users:', userError);
          }
        } catch (userErr) {
          console.warn('Tabela users não existe ou erro:', userErr.message);
          // Continua normalmente mesmo sem tabela users
        }

        setSalon(newSalon);
        setNeedsSetup(false);
        return newSalon;
      }
    } catch (err) {
      console.error('Erro ao salvar salão:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshSalon = () => loadSalonData();

  useEffect(() => {
    if (user) {
      console.log('Usuário disponível, carregando dados do salão...');
      loadSalonData();
    } else {
      console.log('Aguardando autenticação...');
      setLoading(false);
    }
  }, [user]);

  const value = {
    salon,
    services,
    setServices,
    professionals,
    loading,
    error,
    needsSetup,
    createOrUpdateSalon, // EXPORTADA para SalonSetup
    refreshSalon
  };

  return (
    <SalonContext.Provider value={value}>
      {children}
    </SalonContext.Provider>
  );
};

export const useSalon = () => {
  const context = useContext(SalonContext);
  if (!context) {
    throw new Error('useSalon deve ser usado dentro de SalonProvider');
  }
  return context;
};
