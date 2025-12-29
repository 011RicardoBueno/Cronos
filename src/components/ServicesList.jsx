import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ServicesList({ services, setServices, salonId }) {
  const [serviceName, setServiceName] = useState("");
  const [serviceDuration, setServiceDuration] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Novo estado

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
          duration_minutes: Number(serviceDuration) 
        }])
        .select()
        .single();

      if (error) throw error;
      
      setServices((prev) => [...prev, data]);
      setServiceName("");
      setServiceDuration("");
    } catch (error) {
      alert("Erro ao criar serviço: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Tem certeza que deseja remover este serviço?")) return;
    
    try {
      const { error } = await supabase.from("services").delete().eq("id", serviceId);
      if (error) throw error;
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    } catch (error) {
      alert("Erro ao remover serviço: " + error.message);
    }
  };

  return (
    <section>
      {/* ... (o restante do JSX permanece igual) ... */}
      <button
        type="submit"
        disabled={isSubmitting} // Desabilita enquanto salva
        style={{
          padding: "8px 16px",
          borderRadius: "8px",
          backgroundColor: isSubmitting ? "#E5E5E5" : "#DBC4C4",
          border: "none",
          color: "#403D39",
          cursor: isSubmitting ? "not-allowed" : "pointer",
        }}
      >
        {isSubmitting ? "Salvando..." : "Adicionar"}
      </button>
      {/* ... */}
    </section>
  );
}