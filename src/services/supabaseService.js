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
  try {
    // 1. Iniciamos a query pedindo TUDO (*) + os dados da tabela services
    let query = supabase
      .from('slots')
      .select(`
        *,
        services (
          name,
          price
        )
      `)
      .eq('professional_id', professionalId);

    // 2. Aplicamos os filtros de data APENAS se eles existirem
    if (startDate && endDate) {
      query = query.gte('start_time', startDate).lte('start_time', endDate);
    }

    // 3. Executamos a query que construímos (usando a variável 'query')
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