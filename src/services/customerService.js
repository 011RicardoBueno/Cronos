import { supabase } from '@/lib/supabase';

export const customerService = {
  /**
   * Cria um cliente no backend.
   * @param {Object} payload - Dados do cliente: { salon_id, name, phone, email }
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (payload) => {
    try {
      // Exemplo usando Supabase
      const { data, error } = await supabase
        .from('customers')
        .insert([payload])
        .select()
        .single();

      return { data, error };
    } catch (err) {
      return { data: null, error: { error: err.message, code: 'INTERNAL_ERROR' } };
    }
  },
};