import { useMemo } from 'react';
import { useSalon } from '@/context/SalonContext';

export const usePlanFeatures = () => {
  const { salon } = useSalon();
  
  // Define 'iniciante' como padrão caso o plano não esteja carregado
  const currentPlan = salon?.plan_type || 'iniciante';

  const features = useMemo(() => {
    // Lógica simples: se não for 'iniciante', é considerado um plano pago/premium
    const isFree = currentPlan === 'iniciante';

    return {
      // Funcionalidades
      canUseCustomTheme: !isFree,
      canUseIntegrations: !isFree,
      canUseWebhooks: !isFree,
      
      // Metadados úteis
      isFree,
      currentPlan
    };
  }, [currentPlan]);

  return features;
};