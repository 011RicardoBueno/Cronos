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
  const { data, error } = await supabase
    .from("slots")
    .select("*, services(name)")
    .eq("professional_id", professionalId)
    .order("time");
  
  if (error) throw error;
  return data;
};

export const deleteSlot = async (slotId) => {
  const { error } = await supabase.from("slots").delete().eq("id", slotId);
  if (error) throw error;
  return true;
};

export const updateSlotTime = async (slotId, newTime) => {
  const { error } = await supabase
    .from("slots")
    .update({ time: newTime.toISOString() })
    .eq("id", slotId);
  
  if (error) throw error;
  return true;
};
