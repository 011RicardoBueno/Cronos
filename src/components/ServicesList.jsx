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
      <form onSubmit={handleCreateService} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
  <input 
    placeholder="Nome do Serviço" 
    value={serviceName} 
    onChange={e => setServiceName(e.target.value)}
    required
    style={{ 
      padding: '12px', 
      borderRadius: '8px', 
      border: '1px solid #ddd', 
      flex: 1,
      backgroundColor: '#ffffff', // Força fundo branco
      color: '#333333',           // Força texto escuro
      fontSize: '14px'
    }}
  />
  <input 
    type="number" 
    placeholder="Minutos" 
    value={serviceDuration} 
    onChange={e => setServiceDuration(e.target.value)}
    required
    style={{ 
      padding: '12px', 
      borderRadius: '8px', 
      border: '1px solid #ddd', 
      width: '100px',
      backgroundColor: '#ffffff', // Força fundo branco
      color: '#333333',           // Força texto escuro
      fontSize: '14px'
    }}
  />
  <input 
    type="number" 
    step="0.01"
    placeholder="Preço R$" 
    value={servicePrice} 
    onChange={e => setServicePrice(e.target.value)}
    required
    style={{ 
      padding: '12px', 
      borderRadius: '8px', 
      border: '1px solid #ddd', 
      width: '120px',
      backgroundColor: '#ffffff', // Força fundo branco
      color: '#333333',           // Força texto escuro
      fontSize: '14px'
    }}
  />
  <button
    type="submit"
    disabled={isSubmitting}
    style={{
      padding: "12px 24px",
      borderRadius: "8px",
      backgroundColor: isSubmitting ? "#E5E5E5" : "#403D39", // Um tom mais escuro para o botão
      border: "none",
      color: "#ffffff", // Texto branco no botão para contraste
      fontWeight: 'bold',
      cursor: isSubmitting ? "not-allowed" : "pointer",
      transition: 'background-color 0.2s'
    }}
  >
    {isSubmitting ? "Salvando..." : "Adicionar"}
  </button>
</form>

      {/* Listagem com formatação de preço */}
      <div style={{ marginTop: '20px' }}>
        {services.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center' }}>Nenhum serviço cadastrado.</p>
        ) : (
          services.map(service => (
            <div key={service.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px', 
              borderBottom: '1px solid #eee',
              backgroundColor: '#fdfdfd'
            }}>
              <div>
                <strong style={{ color: '#333' }}>{service.name}</strong>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {service.duration_minutes} min • R$ {Number(service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <button 
                onClick={() => handleDeleteService(service.id)} // AGORA DEVE FUNCIONAR
                style={{ 
                  color: '#e74c3c', 
                  border: 'none', 
                  background: 'none', 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  padding: '5px'
                }}
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