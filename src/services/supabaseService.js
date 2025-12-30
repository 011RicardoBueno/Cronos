// services/supabaseService.js
import { supabase } from "../lib/supabase";

export const fetchSalonData = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("salon_id, salons(id, name)")
    .eq("id", userId)
    .single();
  
  if (error) throw error;
  return data;
};

export const fetchServicesAndProfessionals = async (salonId) => {
  const [servicesRes, professionalsRes] = await Promise.all([
    supabase.from("services").select("*").eq("salon_id", salonId).order("created_at"),
    supabase.from("professionals").select("*").eq("salon_id", salonId).order("name"),
  ]);
  
  return { servicesRes, professionalsRes };
};

export const fetchProfessionalSlots = async (professionalId) => {
  // Remova filtros de data temporariamente para testar se os dados aparecem
  const { data, error } = await supabase
    .from('slots')
    .select('*')
    .eq('professional_id', professionalId);
    
  if (error) {
    console.error("Erro na busca de slots:", error);
    throw error;
  }
  console.log(`Slots encontrados para o prof ${professionalId}:`, data); // Adicione este log
  return data;
};

export const deleteSlot = async (slotId) => {
  const { error } = await supabase.from("slots").delete().eq("id", slotId);
  if (error) throw error;
  return true;
};

export const updateSlotTime = async (slotId, newStart) => {
  const { data, error } = await supabase
    .from('slots')
    .update({ start_time: newStart.toISOString() }) // Mudamos de 'time' para 'start_time'
    .eq('id', slotId);
  if (error) throw error;
  return data;
};
