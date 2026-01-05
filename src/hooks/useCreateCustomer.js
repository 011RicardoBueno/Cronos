import { useState } from 'react';

/**
 * Hook para criar cliente usando a função Edge do Supabase
 * Lembre-se: a função Edge precisa estar com CORS habilitado.
 */
export function useCreateCustomer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  const reset = () => {
    setError(null);
    setErrorCode(null);
  };

  const createCustomer = async ({ salon_id, name, phone, email }) => {
    setLoading(true);
    reset();

    try {
      const res = await fetch(
        'https://hmxwdblqsclsjjvctiwe.supabase.co/functions/v1/create_customer',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ salon_id, name, phone, email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message || 'Erro desconhecido');
        setErrorCode(data?.error?.code || null);
        setLoading(false);
        return { success: false, data: null };
      }

      setLoading(false);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      setErrorCode('INTERNAL_ERROR');
      setLoading(false);
      return { success: false, data: null };
    }
  };

  return { createCustomer, loading, error, errorCode, reset };
}
