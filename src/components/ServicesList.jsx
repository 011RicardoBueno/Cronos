import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ServicesList({ services, setServices, salonId }) {
  const [serviceName, setServiceName] = useState("");
  const [serviceDuration, setServiceDuration] = useState("");
  const [servicePrice, setServicePrice] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .insert([{ 
          salon_id: salonId, 
          name: serviceName, 
          duration_minutes: Number(serviceDuration),
          price: parseFloat(servicePrice.replace(',', '.')) // Garante que aceita vírgula ou ponto
        }])
        .select()
        .single();

      if (error) throw error;
      
      setServices((prev) => [...prev, data]);
      setServiceName("");
      setServiceDuration("");
      setServicePrice("");
    } catch (error) {
      alert("Erro ao criar serviço: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // FUNÇÃO DE DELEÇÃO (Certifique-se de que ela está dentro do componente)
  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Tem certeza que deseja remover este serviço?")) return;
    
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;
      
      // Atualiza o estado local removendo o item
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    } catch (error) {
      alert("Erro ao remover serviço: " + error.message);
    }
  };

  return (
    <section>
      <form onSubmit={handleCreateService} className="flex flex-wrap gap-3 mb-6">
        <input 
          placeholder="Nome do Serviço" 
          value={serviceName} 
          onChange={e => setServiceName(e.target.value)}
          required
          className="flex-1 bg-brand-surface border border-brand-muted/20 rounded-xl p-3 text-sm text-brand-text outline-none focus:border-brand-primary transition-all"
        />
        <input 
          type="number" 
          placeholder="Minutos" 
          value={serviceDuration} 
          onChange={e => setServiceDuration(e.target.value)}
          required
          className="w-24 bg-brand-surface border border-brand-muted/20 rounded-xl p-3 text-sm text-brand-text outline-none focus:border-brand-primary transition-all"
        />
        <input 
          type="number" 
          step="0.01"
          placeholder="Preço R$" 
          value={servicePrice} 
          onChange={e => setServicePrice(e.target.value)}
          required
          className="w-32 bg-brand-surface border border-brand-muted/20 rounded-xl p-3 text-sm text-brand-text outline-none focus:border-brand-primary transition-all"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-3 rounded-xl font-bold text-white transition-all ${
            isSubmitting 
              ? 'bg-brand-muted cursor-not-allowed' 
              : 'bg-brand-primary hover:opacity-90 shadow-lg shadow-brand-primary/20'
          }`}
        >
          {isSubmitting ? "Salvando..." : "Adicionar"}
        </button>
      </form>

      {/* Listagem com formatação de preço */}
      <div className="space-y-2">
        {services.length === 0 ? (
          <p className="text-brand-muted text-center py-4">Nenhum serviço cadastrado.</p>
        ) : (
          services.map(service => (
            <div key={service.id} className="flex justify-between items-center p-4 border-b border-brand-muted/10 bg-brand-card hover:bg-brand-surface transition-colors rounded-lg">
              <div>
                <strong className="text-brand-text block">{service.name}</strong>
                <div className="text-xs text-brand-muted mt-1">
                  {service.duration_minutes} min • R$ {Number(service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <button 
                onClick={() => handleDeleteService(service.id)} // AGORA DEVE FUNCIONAR
                className="text-red-500 hover:text-red-600 font-bold p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                Remover
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}