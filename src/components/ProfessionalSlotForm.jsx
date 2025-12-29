import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ProfessionalSlotForm({ services, professionalId, slotsByProfessional, setSlotsByProfessional }) {
  const [slotTime, setSlotTime] = useState("");
  const [slotServiceId, setSlotServiceId] = useState("");

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!slotServiceId) return;

    const { data, error } = await supabase
      .from("slots")
      .insert([{ professional_id: professionalId, time: slotTime, service_id: slotServiceId }])
      .select("*, services(name)")
      .single();

    if (error) console.error(error);
    else setSlotsByProfessional((prev) => ({
      ...prev,
      [professionalId]: [...(prev[professionalId] || []), data],
    }));

    setSlotTime("");
    setSlotServiceId("");
  };

  return (
    <form onSubmit={handleCreateSlot} style={{ marginBottom: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
      <input
        type="datetime-local"
        value={slotTime}
        onChange={(e) => setSlotTime(e.target.value)}
        required
        style={{ padding: "8px", borderRadius: "8px", border: "1px solid #F3EEEA", flex: "1 1 200px" }}
      />
      <select
        value={slotServiceId}
        onChange={(e) => setSlotServiceId(e.target.value)}
        required
        style={{ padding: "8px", borderRadius: "8px", border: "1px solid #F3EEEA", flex: "1 1 150px" }}
      >
        <option value="">Serviço</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
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
  );
}
