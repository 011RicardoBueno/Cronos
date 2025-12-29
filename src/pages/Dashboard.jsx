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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const handleDeleteSlot = async (slotId, professionalId) => {
    if (!window.confirm("Deseja realmente cancelar este agendamento?")) return;

    const { error } = await supabase
      .from("slots")
      .delete()
      .eq("id", slotId);

    if (error) {
      alert("Erro ao cancelar: " + error.message);
      return;
    }

    setSlotsByProfessional((prev) => ({
      ...prev,
      [professionalId]: prev[professionalId].filter(
        (slot) => slot.id !== slotId
      ),
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
        [professionalId]: prev[professionalId].map((slot) =>
          slot.id === slotId
            ? { ...slot, time: newStart.toISOString() }
            : slot
        ),
      }));

      console.log("Agendamento atualizado com sucesso");
    } catch (err) {
      console.error("Erro ao mover agendamento:", err);
      alert("Erro ao mover agendamento");
    }
  };

  const todaySlotsCount = Object.values(slotsByProfessional)
    .flat()
    .filter((slot) =>
      moment(slot.time).isSame(new Date(), "day")
    ).length;

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

  return (
    <div
      style={{
        backgroundColor: colors.offWhite,
        minHeight: "100vh",
        paddingBottom: "40px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <header style={{ marginBottom: "40px", textAlign: "center" }}>
          <h1
            style={{
              color: colors.deepCharcoal,
              fontSize: "2.5rem",
              fontWeight: "300",
              marginBottom: "10px",
            }}
          >
            {salon.name}
          </h1>

          <p style={{ color: "#888", fontWeight: "300" }}>
            Gestão de Agenda & Serviços
          </p>

          <p style={{ color: colors.deepCharcoal, fontSize: "1.1rem" }}>
            Hoje: <strong>{todaySlotsCount}</strong> agendamento
            {todaySlotsCount !== 1 ? "s" : ""}
          </p>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: "10px 20px",
              backgroundColor: colors.sageGreen,
              color: "white",
              border: "none",
              borderRadius: "8px",
              opacity: refreshing ? 0.7 : 1,
            }}
          >
            {refreshing ? "Atualizando..." : "Atualizar Dados"}
          </button>
        </header>

        {professionals.map((pro) => (
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
            <h2 style={{ marginBottom: "20px" }}>
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
          <h2 style={{ marginBottom: "20px" }}>Catálogo de Serviços</h2>
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
