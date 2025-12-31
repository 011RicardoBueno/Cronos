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

// Centraliza a criação de agendamentos para evitar erros de RLS e formatação
export const createBookingSlot = async (bookingData) => {
  const { data, error } = await supabase
    .from('slots')
    .insert([{
      salon_id: bookingData.salonId,
      professional_id: bookingData.professionalId,
      service_id: bookingData.serviceId,
      client_id: bookingData.clientId || null,
      client_name: bookingData.clientName,
      client_phone: bookingData.clientPhone,
      start_time: bookingData.startTime,
      end_time: bookingData.endTime,
      status: 'confirmed'
    }]);

  if (error) throw error;
  return data;
};

export const fetchProfessionalSlots = async (professionalId, startDate, endDate) => {
  try {
    let query = supabase
      .from('slots')
      .select(`
        *,
        services (name, price)
      `)
      .eq('professional_id', professionalId);

    if (startDate && endDate) {
      query = query.gte('start_time', startDate).lte('start_time', endDate);
    }

    const { data, error } = await query.order('start_time', { ascending: true });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro na busca de slots:", error);
    throw error;
  }
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