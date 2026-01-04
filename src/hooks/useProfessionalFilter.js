// hooks/useProfessionalFilter.js
import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEY, URL_PARAM_KEY } from '@/constants/dashboard';
import { getProfessionalFromURL } from '@/utils/dashboardUtils';

export const useProfessionalFilter = (initialValue = "all") => {
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(() => {
    const fromURL = getProfessionalFromURL();
    return fromURL || localStorage.getItem(STORAGE_KEY) || initialValue;
  });

  const updateUrlAndStorage = useCallback((professionalId) => {
    localStorage.setItem(STORAGE_KEY, professionalId);
    
    const params = new URLSearchParams(window.location.search);
    if (professionalId === "all") {
      params.delete(URL_PARAM_KEY);
    } else {
      params.set(URL_PARAM_KEY, professionalId);
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", newUrl);
  }, []);

  // Efeito para sincronizar URL e localStorage
  useEffect(() => {
    if (!selectedProfessionalId) return;
    updateUrlAndStorage(selectedProfessionalId);
  }, [selectedProfessionalId, updateUrlAndStorage]);

  return {
    selectedProfessionalId,
    setSelectedProfessionalId,
    updateUrlAndStorage
  };
};
