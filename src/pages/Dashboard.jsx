import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import moment from "moment";

import DashboardHeader from "../components/layout/DashboardHeader";
import ProfessionalsSection from "../components/ProfessionalsSection";
import ServicesSection from "../components/ServicesSection";

function getProfessionalFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("pro");
}

export default function Dashboard({ session }) {
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [slotsByProfessional, setSlotsByProfessional] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(() => {
    const fromURL = getProfessionalFromURL();
    return fromURL || localStorage.getItem("cronos:selectedProfessional") || "all";
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

      if (userError || !userData?.salons) throw new Error("Salão não encontrado");
      setSalon(userData.salons);

      const [servicesRes, professionalsRes] = await Promise.all([
        supabase.from("services").select("*").eq("salon_id", userData.salons.id).order("created_at"),
        supabase.from("professionals").select("*").eq("salon_id", userData.salons.id).order("name"),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (professionalsRes.error) throw professionalsRes.error;

      setServices(servicesRes.data || []);
      setProfessionals(professionalsRes.data || []);

      // Ajusta selectedProfessionalId caso não exista mais
      const exists = (professionalsRes.data || []).some(p => p.id === selectedProfessionalId);
      if (!exists && selectedProfessionalId !== "all") setSelectedProfessionalId("all");

      const slotsPromises = (professionalsRes.data || []).map(pro =>
        supabase.from("slots").select("*, services(name)").eq("professional_id", pro.id).order("time")
      );
      const slotsResults = await Promise.all(slotsPromises);

      const slotsMap = {};
      (professionalsRes.data || []).forEach((pro, idx) => {
        slotsMap[pro.id] = slotsResults[idx].data || [];
      });
      setSlotsByProfessional(slotsMap);
    } catch (err) {
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [session, selectedProfessionalId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Atualiza localStorage e URL quando o filtro muda
  useEffect(() => {
    localStorage.setItem("cronos:selectedProfessional", selectedProfessionalId);
    const params = new URLSearchParams(window.location.search);
    selectedProfessionalId === "all" ? params.delete("pro") : params.set("pro", selectedProfessionalId);
    window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  }, [selectedProfessionalId]);

  // Funções de manipulação de slots
  const handleDeleteSlot = async (slotId, profId) => {
    if (!window.confirm("Deseja realmente cancelar este agendamento?")) return;
    const { error } = await supabase.from("slots").delete().eq("id", slotId);
    if (!error) {
      setSlotsByProfessional(prev => ({
        ...prev,
        [profId]: prev[profId].filter(s => s.id !== slotId)
      }));
    } else {
      alert("Erro ao cancelar: " + error.message);
    }
  };

  const handleMoveSlot = async ({ slotId, professionalId, newStart }) => {
    const { error } = await supabase.from("slots").update({ time: newStart.toISOString() }).eq("id", slotId);
    if (!error) {
      setSlotsByProfessional(prev => ({
        ...prev,
        [professionalId]: prev[professionalId].map(s => s.id === slotId ? { ...s, time: newStart.toISOString() } : s)
      }));
    } else {
      alert("Erro ao mover agendamento: " + error.message);
    }
  };

  const todaySlotsCount = Object.values(slotsByProfessional).flat()
    .filter(slot => moment(slot.time).isSame(new Date(), "day")).length;

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Carregando painel...</div>;
  if (error) return <div style={{ padding: 40, textAlign: "center", color: "red" }}>{error}</div>;
  if (!salon) return <div style={{ padding: 40 }}>Salão não encontrado</div>;

  return (
    <div style={{ backgroundColor: colors.offWhite, minHeight: "100vh", paddingBottom: "40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        
        <DashboardHeader
          salon={salon}
          todaySlotsCount={todaySlotsCount}
          selectedProfessionalId={selectedProfessionalId}
          setSelectedProfessionalId={setSelectedProfessionalId}
          professionals={professionals}
          colors={colors}
        />

        <ProfessionalsSection
          professionals={professionals}
          selectedProfessionalId={selectedProfessionalId}
          setSelectedProfessionalId={setSelectedProfessionalId}
          services={services}
          slotsByProfessional={slotsByProfessional}
          setSlotsByProfessional={setSlotsByProfessional}
          loadDashboardData={loadDashboardData}
          handleDeleteSlot={handleDeleteSlot}
          handleMoveSlot={handleMoveSlot}
          colors={colors}
        />

        <ServicesSection
          services={services}
          setServices={setServices}
          salonId={salon.id}
          colors={colors}
        />
      </div>
    </div>
  );
}
