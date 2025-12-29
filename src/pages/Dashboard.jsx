import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import ProfessionalCalendar from "../components/ProfessionalCalendar";
import ServicesList from "../components/ServicesList";
import ProfessionalSlotForm from "../components/ProfessionalSlotForm";
import moment from "moment";

export default function Dashboard({ session }) {
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [slotsByProfessional, setSlotsByProfessional] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(() => {
  return localStorage.getItem("cronos:selectedProfessional") || "all";
});


  const colors = {
    offWhite: "#FAFAF9",
    warmSand: "#F3EEEA",
    dustyRose: "#DBC4C4",
    sageGreen: "#A3B18A",
    deepCharcoal: "#403D39",
    white: "#FFFFFF",
  };

  const loadDashboardData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);

    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("salon_id, salons(id, name)")
        .eq("id", session.user.id)
        .single();

      if (userError || !userData?.salons) {
        throw new Error("Salão não encontrado");
      }

      setSalon(userData.salons);

      const [servicesRes, professionalsRes] = await Promise.all([
        supabase
          .from("services")
          .select("*")
          .eq("salon_id", userData.salons.id)
          .order("created_at"),
        supabase
          .from("professionals")
          .select("*")
          .eq("salon_id", userData.salons.id)
          .order("name"),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (professionalsRes.error) throw professionalsRes.error;

      setServices(servicesRes.data);
      setProfessionals(professionalsRes.data);

      const exists = professionalsRes.data.some(
  (p) => p.id === selectedProfessionalId
);

if (!exists && selectedProfessionalId !== "all") {
  setSelectedProfessionalId("all");
}


      const slotsPromises = professionalsRes.data.map((pro) =>
        supabase
          .from("slots")
          .select("*, services(name)")
          .eq("professional_id", pro.id)
          .order("time")
      );

      const slotsResults = await Promise.all(slotsPromises);

      const slotsMap = {};
      professionalsRes.data.forEach((pro, idx) => {
        slotsMap[pro.id] = slotsResults[idx].data || [];
      });

      setSlotsByProfessional(slotsMap);
    } catch (err) {
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
  localStorage.setItem(
    "cronos:selectedProfessional",
    selectedProfessionalId
  );
}, [selectedProfessionalId]);


  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const handleDeleteSlot = async (slotId, profId) => {
    if (!window.confirm("Deseja realmente cancelar este agendamento?")) return;

    const { error } = await supabase.from("slots").delete().eq("id", slotId);

    if (error) {
      alert("Erro ao cancelar: " + error.message);
      return;
    }

    setSlotsByProfessional((prev) => ({
      ...prev,
      [profId]: prev[profId].filter((s) => s.id !== slotId),
    }));
  };

  const handleMoveSlot = async ({ slotId, professionalId, newStart }) => {
    try {
      const { error } = await supabase
        .from("slots")
        .update({ time: newStart.toISOString() })
        .eq("id", slotId);

      if (error) throw error;

      setSlotsByProfessional((prev) => ({
        ...prev,
        [professionalId]: prev[professionalId].map((s) =>
          s.id === slotId ? { ...s, time: newStart.toISOString() } : s
        ),
      }));

      console.log("Agendamento atualizado com sucesso");
    } catch (err) {
      console.error("Erro ao mover agendamento:", err);
    }
  };

  const todaySlotsCount = Object.values(slotsByProfessional)
    .flat()
    .filter((slot) => moment(slot.time).isSame(new Date(), "day")).length;

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: colors.deepCharcoal }}>
        Carregando painel...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red" }}>
        {error}
      </div>
    );
  }

  if (!salon) {
    return (
      <div style={{ padding: 40, color: colors.deepCharcoal }}>
        Salão não encontrado
      </div>
    );
  }

  const professionalsToRender =
    selectedProfessionalId === "all"
      ? professionals
      : professionals.filter((p) => p.id === selectedProfessionalId);

  return (
    <div style={{ backgroundColor: colors.offWhite, minHeight: "100vh", paddingBottom: "40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <header style={{ marginBottom: "30px", textAlign: "center" }}>
          <h1 style={{ color: colors.deepCharcoal, fontSize: "2.5rem", fontWeight: 300 }}>
            {salon.name}
          </h1>
          <p style={{ color: "#888", fontWeight: 300 }}>
            Gestão de Agenda & Serviços
          </p>
          <p style={{ color: colors.deepCharcoal }}>
            Hoje: <strong>{todaySlotsCount}</strong> agendamento{todaySlotsCount !== 1 ? "s" : ""}
          </p>
        </header>

        {/* Pills de filtro */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: "40px",
          }}
        >
          <button
            onClick={() => setSelectedProfessionalId("all")}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "none",
              backgroundColor:
                selectedProfessionalId === "all"
                  ? colors.sageGreen
                  : colors.warmSand,
              color:
                selectedProfessionalId === "all"
                  ? "white"
                  : colors.deepCharcoal,
              fontWeight: 500,
            }}
          >
            Todos
          </button>

          {professionals.map((pro) => (
            <button
              key={pro.id}
              onClick={() => setSelectedProfessionalId(pro.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                backgroundColor:
                  selectedProfessionalId === pro.id
                    ? colors.sageGreen
                    : colors.warmSand,
                color:
                  selectedProfessionalId === pro.id
                    ? "white"
                    : colors.deepCharcoal,
                fontWeight: 500,
              }}
            >
              {pro.name}
            </button>
          ))}
        </div>

        {professionalsToRender.map((pro) => (
          <section
            key={pro.id}
            style={{
              backgroundColor: colors.white,
              borderRadius: "16px",
              padding: "30px",
              marginBottom: "40px",
              border: `1px solid ${colors.warmSand}`,
            }}
          >
            <h2 style={{ color: colors.deepCharcoal, marginBottom: "20px" }}>
              Agenda: <strong>{pro.name}</strong>
            </h2>

            <ProfessionalSlotForm
              services={services}
              professionalId={pro.id}
              slotsByProfessional={slotsByProfessional}
              setSlotsByProfessional={setSlotsByProfessional}
              colors={colors}
              onSlotCreated={loadDashboardData}
            />

            <ProfessionalCalendar
              slots={slotsByProfessional[pro.id] || []}
              professionalId={pro.id}
              handleDeleteSlot={handleDeleteSlot}
              handleMoveSlot={handleMoveSlot}
            />
          </section>
        ))}

        <section
          style={{
            backgroundColor: colors.white,
            borderRadius: "16px",
            padding: "30px",
            border: `1px solid ${colors.warmSand}`,
          }}
        >
          <h2 style={{ color: colors.deepCharcoal, marginBottom: "20px" }}>
            Catálogo de Serviços
          </h2>
          <ServicesList
            services={services}
            setServices={setServices}
            salonId={salon.id}
          />
        </section>
      </div>
    </div>
  );
}
