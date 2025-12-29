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
  const [refreshing, setRefreshing] = useState(false); // Novo: loading no refresh

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

      if (userError || !userData?.salons) throw new Error("Salão não encontrado");

      setSalon(userData.salons);

      const [servicesRes, professionalsRes] = await Promise.all([
        supabase.from("services").select("*").eq("salon_id", userData.salons.id).order("created_at"),
        supabase.from("professionals").select("*").eq("salon_id", userData.salons.id).order("name"),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      setServices(servicesRes.data);

      if (professionalsRes.error) throw professionalsRes.error;
      setProfessionals(professionalsRes.data);

      const slotsPromises = professionalsRes.data.map((pro) =>
        supabase.from("slots").select("*, services(name)").eq("professional_id", pro.id).order("time")
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

  // Deleção real no banco + atualização local
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

  // Cálculo de agendamentos de hoje
  const todaySlotsCount = Object.values(slotsByProfessional)
    .flat()
    .filter((slot) => moment(slot.time).isSame(new Date(), "day")).length;

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: colors.deepCharcoal }}>Carregando painel...</div>;
  if (error) return <div style={{ padding: 40, textAlign: "center", color: "red" }}>{error}</div>;
  if (!salon) return <div style={{ padding: 40, color: colors.deepCharcoal }}>Salão não encontrado</div>;

  return (
    <div style={{ backgroundColor: colors.offWhite, minHeight: "100vh", paddingBottom: "40px" }}>
      <style>{`
        .rbc-calendar { font-family: 'Helvetica Neue', Arial, sans-serif; color: ${colors.deepCharcoal}; }
        .rbc-header { padding: 12px 5px; font-weight: 600; color: ${colors.deepCharcoal}; border-bottom: 2px solid ${colors.warmSand}; }
        .rbc-time-view { border: 1px solid ${colors.warmSand}; border-radius: 12px; overflow: hidden; background: ${colors.white}; }
        .rbc-day-slot .rbc-time-slot { border-top: 1px solid ${colors.warmSand}; }
        .rbc-timeslot-group { border-bottom: 1px solid ${colors.warmSand}; }
        .rbc-time-content { border-top: 1px solid ${colors.warmSand}; }
        .rbc-time-gutter .rbc-timeslot-group { border-bottom: 1px solid ${colors.warmSand}; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid ${colors.warmSand}; }
        .rbc-time-header.rbc-overflowing { border-right: 1px solid ${colors.warmSand}; }
        .rbc-current-time-indicator { background-color: ${colors.sageGreen}; height: 2px; }
        .rbc-today { background-color: ${colors.offWhite}; }
        button { cursor: pointer; transition: opacity 0.2s; }
        button:hover { opacity: 0.85; }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <header style={{ marginBottom: "40px", textAlign: "center" }}>
          <h1 style={{ color: colors.deepCharcoal, fontSize: "2.5rem", fontWeight: "300", marginBottom: "10px" }}>
            {salon.name}
          </h1>
          <p style={{ color: "#888", fontWeight: "300", marginBottom: "10px" }}>
            Gestão de Agenda & Serviços
          </p>
          <p style={{ color: colors.deepCharcoal, fontSize: "1.1rem", marginBottom: "15px" }}>
            Hoje: <strong>{todaySlotsCount}</strong> agendamento{todaySlotsCount !== 1 ? "s" : ""}
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
              fontSize: "1rem",
              opacity: refreshing ? 0.7 : 1,
              cursor: refreshing ? "not-allowed" : "pointer",
            }}
          >
            {refreshing ? "Atualizando..." : "🔄 Atualizar Dados"}
          </button>
        </header>

        {professionals.map((pro) => (
          <section
            key={pro.id}
            style={{
              backgroundColor: colors.white,
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              padding: "30px",
              marginBottom: "40px",
              border: `1px solid ${colors.warmSand}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ color: colors.deepCharcoal, margin: 0, fontWeight: "500" }}>
                Agenda: <span style={{ fontWeight: "bold" }}>{pro.name}</span>
              </h2>
              <div style={{ fontSize: "0.9rem", color: colors.sageGreen, backgroundColor: "#F0F5F0", padding: "5px 12px", borderRadius: "20px" }}>
                ● Profissional Ativo
              </div>
            </div>

            <div style={{ marginBottom: "25px", padding: "20px", backgroundColor: colors.offWhite, borderRadius: "12px" }}>
              <ProfessionalSlotForm
                services={services}
                professionalId={pro.id}
                slotsByProfessional={slotsByProfessional}
                setSlotsByProfessional={setSlotsByProfessional}
                colors={colors}
                onSlotCreated={loadDashboardData}
              />
            </div>

            <ProfessionalCalendar
              slots={slotsByProfessional[pro.id] || []}
              professionalId={pro.id}
              handleDeleteSlot={handleDeleteSlot}
            />
          </section>
        ))}

        <hr style={{ border: "none", borderTop: `1px solid ${colors.warmSand}`, margin: "40px 0" }} />

        <section
          style={{
            backgroundColor: colors.white,
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            padding: "30px",
            border: `1px solid ${colors.warmSand}`,
          }}
        >
          <h2 style={{ color: colors.deepCharcoal, marginBottom: "20px", fontWeight: "500" }}>Catálogo de Serviços</h2>
          <ServicesList services={services} setServices={setServices} salonId={salon.id} />
        </section>
      </div>
    </div>
  );
}