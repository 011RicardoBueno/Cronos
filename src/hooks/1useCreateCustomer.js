import { useState } from 'react';

export const useCreateCustomer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  const reset = () => {
    setError(null);
    setErrorCode(null);
  };

  /**
   * Cria um cliente chamando a Edge Function
   * @param {Object} payload - { salon_id, name, phone, email }
   */
  const createCustomer = async (payload) => {
    setLoading(true);
    reset();

    try {
      const response = await fetch(import.meta.env.VITE_SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        const code = data?.error?.code || 'INTERNAL_ERROR';
        setError(data?.error?.message || 'Erro desconhecido');
        setErrorCode(code);
        return { success: false };
      }

      return { success: true, data: data.data };
    } catch (err) {
      setLoading(false);
      setError(err.message);
      setErrorCode('INTERNAL_ERROR');
      return { success: false };
    }
  };

  return { createCustomer, loading, error, errorCode, reset };
};
