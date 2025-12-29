// utils/dashboardUtils.js
import moment from "moment";

export function getProfessionalFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("pro");
}

export const getTodaySlotsCount = (slotsByProfessional) => {
  const today = new Date();
  return Object.values(slotsByProfessional)
    .flat()
    .filter(slot => moment(slot.time).isSame(today, "day"))
    .length;
};

// Função para validar se profissional existe
export const validateProfessionalExists = (professionals, professionalId) => {
  return professionals.some(p => p.id === professionalId) || professionalId === "all";
};
