import { supabase } from "../lib/supabase";
import moment from 'moment';

// --- BUSCA DE DADOS BÁSICOS ---

export const fetchSalonData = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("salon_id, salons(*)") // Fetch all salon data
    .eq("id", userId)
    .single();
  
  if (error) throw error;
  return data;
};

export const fetchSalonByIdOrSlug = async (identifier) => {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
  const query = supabase.from('salons').select('*');
  
  if (isUUID) {
    query.eq('id', identifier);
  } else {
    query.eq('slug', identifier);
  }

  const { data, error } = await query.single();
  if (error) throw new Error("Salão não encontrado");
  return data;
};

export const fetchServicesAndProfessionals = async (salonId) => {
  const [servicesRes, professionalsRes] = await Promise.all([
    supabase.from("services").select("*").eq("salon_id", salonId).order("name"),
    supabase.from("professionals").select("*").eq("salon_id", salonId).order("name"),
  ]);
  
  if (servicesRes.error || professionalsRes.error) throw servicesRes.error || professionalsRes.error;
  return { services: servicesRes.data || [], professionals: professionalsRes.data || [] };
};

export const fetchProfessionalsDetailed = async (salonId) => {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('salon_id', salonId)
    .order('avg_rating', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const fetchProfessionalServices = async (professionalIds) => {
  if (!professionalIds || professionalIds.length === 0) return [];
  const { data, error } = await supabase
    .from('professional_services')
    .select('*')
    .in('professional_id', professionalIds);
  if (error) throw error;
  return data;
};

// --- GESTÃO DE AGENDAMENTOS (SLOTS) ---

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

export const fetchAppointmentsByClientId = async (userId) => {
  const { data, error } = await supabase
    .from('slots')
    .select(`
      *,
      services (name, price),
      professionals (name, avatar_url),
      salons (name, slug, logo_url)
    `)
    .eq('client_id', userId)
    .order('start_time', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchProfessionalSlots = async (professionalId, startDate, endDate) => {
  try {
    let query = supabase
      .from('slots')
      .select(`
        *,
        services (name, price),
        professionals (name, commission_rate)
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

export const fetchRecentAppointments = async (salonId, limit = 5) => {
  const { data, error } = await supabase
    .from('slots')
    .select('*, services(name)')
    .eq('salon_id', salonId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
};

export const fetchSlotById = async (slotId) => {
  const { data, error } = await supabase
    .from('slots')
    .select('*, services(name)')
    .eq('id', slotId)
    .single();
  
  if (error) throw error;
  return data;
};

export const fetchBusySlotsForDate = async (professionalId, date) => {
  const startDay = moment(date).startOf('day').toISOString();
  const endDay = moment(date).endOf('day').toISOString();

  const { data, error } = await supabase
    .from('slots')
    .select('start_time, end_time')
    .eq('professional_id', professionalId)
    .gte('start_time', startDay)
    .lte('start_time', endDay);
  
  if (error) throw error;
  return data || [];
};

// --- MOTOR FINANCEIRO E CHECKOUT ---

export const processSale = async ({ 
  salonId, 
  slotId = null, 
  items = [], 
  advanceAmount = 0,
  paymentMethod = 'Presencial'
}) => {
  try {
    // This entire logic is now handled by a single, atomic RPC call
    // to the 'process_sale' function in the database.
    const { error } = await supabase.rpc('process_sale', {
      p_salon_id: salonId,
      p_slot_id: slotId,
      p_items: items,
      p_advance_amount: advanceAmount,
      p_payment_method: paymentMethod
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Erro processSale:", error);
    throw error;
  }
};

// --- GESTÃO DE PRODUTOS ---

export const fetchProducts = async (salonId) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('salon_id', salonId)
    .order('name');
  
  if (error) throw error;
  return data;
};

export const fetchLowStockProducts = async (salonId, { threshold = 10, limit = 5 } = {}) => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, stock_quantity')
    .eq('salon_id', salonId)
    .lt('stock_quantity', threshold)
    .order('stock_quantity', { ascending: true })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
};

// --- REALTIME ---

export const subscribeToNewAppointments = (salonId, callback) => {
  const channel = supabase.channel(`realtime:slots:${salonId}`);
  
  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'slots', filter: `salon_id=eq.${salonId}` },
    callback
  ).subscribe();

  return channel;
};

export const unsubscribeFromChannel = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};

export const createProduct = async (productData) => {
  const { data, error } = await supabase
    .from('products')
    .insert([productData]);
  
  if (error) throw error;
  return data;
};