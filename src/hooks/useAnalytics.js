import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useAnalytics() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState({
    professionalPerformance: [],
    atRiskClients: [],
    recentExpenses: [],
    stats: { 
      totalRevenue: 0, 
      totalAppointments: 0, 
      totalExpenses: 0, 
      netProfit: 0 
    }
  });

  const fetchAnalytics = useCallback(async (days = 30) => {
    setLoading(true);
    try {
      // Safely convert days to integer with fallback
      let daysParam;
      if (typeof days === 'string') {
        daysParam = parseInt(days, 10);
      } else if (typeof days === 'number') {
        daysParam = Math.floor(days); // Ensure integer
      } else {
        daysParam = 30; // Default fallback
      }
      
      // Handle NaN case
      if (isNaN(daysParam) || daysParam <= 0) {
        daysParam = 30;
      }

      // Debug: log the parameter
      console.log('Calling get_salon_analytics with days:', daysParam, 'Type:', typeof daysParam);

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Single RPC call to the new database function
      const { data, error } = await supabase.rpc('get_full_analytics', {
        days_param: daysParam
      });

      if (error) {
        console.error('Supabase RPC error details:', error);
        throw error;
      }

      // Handle case where data might be null or malformed
      if (!data) {
        console.warn('No data returned from analytics function');
        // Return empty insights instead of throwing
        setInsights({
          professionalPerformance: [],
          atRiskClients: [],
          recentExpenses: [],
          stats: { 
            totalRevenue: 0, 
            totalAppointments: 0, 
            totalExpenses: 0, 
            netProfit: 0 
          }
        });
        return;
      }

      // Ensure we have all required properties
      const safeData = {
        professionalPerformance: Array.isArray(data.professionalPerformance) 
          ? data.professionalPerformance 
          : [],
        atRiskClients: Array.isArray(data.atRiskClients) 
          ? data.atRiskClients 
          : [],
        recentExpenses: Array.isArray(data.recentExpenses) 
          ? data.recentExpenses 
          : [],
        stats: data.stats && typeof data.stats === 'object' 
          ? { 
              totalRevenue: Number(data.stats.totalRevenue) || 0, 
              totalAppointments: Number(data.stats.totalAppointments) || 0, 
              totalExpenses: Number(data.stats.totalExpenses) || 0, 
              netProfit: Number(data.stats.netProfit) || 0 
            }
          : { 
              totalRevenue: 0, 
              totalAppointments: 0, 
              totalExpenses: 0, 
              netProfit: 0 
            }
      };

      console.log('Analytics data received:', safeData);
      setInsights(safeData);

    } catch (error) {
      console.error("Erro no useAnalytics:", error);
      toast.error(`Falha ao carregar análises: ${error.message}`);
      
      // Set empty insights on error
      setInsights({
        professionalPerformance: [],
        atRiskClients: [],
        recentExpenses: [],
        stats: { 
          totalRevenue: 0, 
          totalAppointments: 0, 
          totalExpenses: 0, 
          netProfit: 0 
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { insights, loading, fetchAnalytics };
}