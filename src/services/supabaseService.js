import { supabase } from "../lib/supabase";

// --- BUSCA DE DADOS BÁSICOS ---

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

export const fetchProfessionalsDetailed = async (salonId) => {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('salon_id', salonId)
    .order('avg_rating', { ascending: false });
  
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

// --- MOTOR FINANCEIRO E CHECKOUT ---

export const processSale = async ({ 
  salonId, 
  slotId = null, 
  items = [], 
  advanceAmount = 0,
  paymentMethod = 'Presencial'
}) => {
  try {
    const transactionRecords = [];

    // 1. Preparar registros para a tabela finance_transactions
    items.forEach(item => {
      const commissionValue = (item.price * (item.commission_rate / 100));
      
      transactionRecords.push({
        salon_id: salonId,
        professional_id: item.professional_id, // Profissional específico do item
        slot_id: slotId,
        amount: item.price,
        professional_commission: commissionValue,
        description: item.description || item.name,
        type: item.type, // 'service' ou 'product'
        payment_method: paymentMethod
      });
    });

    // 2. Registrar no financeiro
    const { error: transError } = await supabase
      .from('finance_transactions')
      .insert(transactionRecords);
    
    if (transError) throw transError;

    // 3. Registrar Adiantamento/Vale se houver
    if (advanceAmount > 0) {
      // Usamos o professional_id do slot (quem atendeu o cliente) para o vale principal
      const mainProfessionalId = items.find(i => i.type === 'service')?.professional_id;

      const { error: advError } = await supabase
        .from('staff_advances')
        .insert([{
          salon_id: salonId,
          professional_id: mainProfessionalId,
          amount: advanceAmount,
          description: `Desconto Checkout - Slot ${slotId?.substring(0,8)}`
        }]);
      if (advError) throw advError;
    }

    // 4. Marcar agendamento como finalizado
    if (slotId) {
      const { error: slotError } = await supabase
        .from('slots')
        .update({ status: 'completed' })
        .eq('id', slotId);
      if (slotError) throw slotError;
    }

    // 5. Baixa de estoque simplificada (Opcional: Requer RPC no Postgres)
    const productItems = items.filter(i => i.type === 'product');
    for (const item of productItems) {
      await supabase.rpc('decrement_product_stock', { 
        pid: item.id, 
        qty: 1 
      }).catch(err => console.warn("Estoque não atualizado:", err));
    }

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

export const createProduct = async (productData) => {
  const { data, error } = await supabase
    .from('products')
    .insert([productData]);
  
  if (error) throw error;
  return data;
};