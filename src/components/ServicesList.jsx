import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ServicesList({ services, setServices, salonId }) {
  const [serviceName, setServiceName] = useState("");
  const [serviceDuration, setServiceDuration] = useState("");

  const handleCreateService = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("services")
      .insert([{ salon_id: salonId, name: serviceName, duration_minutes: Number(serviceDuration) }])
      .select()
      .single();

    if (error) console.error(error);
    else setServices((prev) => [...prev, data]);

    setServiceName("");
    setServiceDuration("");
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Tem certeza que deseja remover este serviço?")) return;
    const { error } = await supabase.from("services").delete().eq("id", serviceId);
    if (error) console.error(error);
    else setServices((prev) => prev.filter((s) => s.id !== serviceId));
  };

  return (
    <section>
      <h2 style={{ color: "#403D39" }}>Serviços</h2>
      <form onSubmit={handleCreateService} style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Nome do serviço"
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          required
          style={{ padding: "8px", borderRadius: "8px", border: "1px solid #F3EEEA", flex: "1 1 150px" }}
        />
        <input
          type="number"
          placeholder="Duração (min)"
          value={serviceDuration}
          onChange={(e) => setServiceDuration(e.target.value)}
          required
          style={{ padding: "8px", borderRadius: "8px", border: "1px solid #F3EEEA", width: "120px" }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            backgroundColor: "#DBC4C4",
            border: "none",
            color: "#403D39",
            cursor: "pointer",
          }}
        >
          Adicionar
        </button>
      </form>

      {services.length === 0 ? (
        <p>Nenhum serviço cadastrado.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {services.map((service) => (
            <li
              key={service.id}
              style={{
                border: "1px solid #F3EEEA",
                borderRadius: "8px",
                padding: "8px",
                marginBottom: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#FAFAF9",
              }}
            >
              <span>{service.name} — {service.duration_minutes} min</span>
              <button
                onClick={() => handleDeleteService(service.id)}
                style={{ color: "red", border: "none", background: "transparent", cursor: "pointer" }}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
