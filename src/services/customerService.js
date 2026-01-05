import { supabase } from '@/lib/supabase';

/**
 * Serviço de cliente usando Edge Function para criação.
 * Mantém a mesma interface { data, error } para compatibilidade com useCreateCustomer.
 */
export const customerService = {
  /**
   * Cria um cliente via Edge Function.
   * @param {Object} payload - Dados do cliente: { salon_id, name, phone, email }
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (payload) => {
    try {
      const { data, error } = await supabase.functions.invoke('create_customer', {
        body: JSON.stringify(payload),
      });

      // Supabase Functions retorna status 200 mesmo com erro, então defensivamente checamos
      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: { error: err.message, code: 'INTERNAL_ERROR' } };
    }
  },
};
