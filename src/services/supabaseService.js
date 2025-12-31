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

// Agora aceita datas para evitar carregar dados desnecessários
export const fetchProfessionalSlots = async (professionalId, startDate, endDate) => {
  let query = supabase
    .from('slots')
    .select('*')
    .eq('professional_id', professionalId);

  // Se datas forem passadas, filtra o período (ex: a semana atual)
  if (startDate && endDate) {
    query = query.gte('start_time', startDate).lte('start_time', endDate);
  }
    
  const { data, error } = await supabase.from('slots').select('*').eq('professional_id', professionalId);
    
  if (error) {
    console.error("Erro na busca de slots:", error);
    throw error;
  }
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
    .update({ start_time: newStart instanceof Date ? newStart.toISOString() : newStart })
    .eq('id', slotId);
  if (error) throw error;
  return data;
};