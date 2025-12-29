export default function DashboardHeader({ salon, kpis, actions = {}, colors }) {
  const {
    todayAppointments,
    pendingConfirmations,
    revenueToday,
    birthdaysThisWeek,
  } = kpis;

  return (
    <header
      style={{
        backgroundColor: colors.white,
        borderRadius: "20px",
        padding: "30px",
        marginBottom: "40px",
        border: `1px solid ${colors.warmSand}`,
      }}
    >
      {/* Identidade */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1
          style={{
            color: colors.deepCharcoal,
            fontSize: "2.4rem",
            fontWeight: 300,
            marginBottom: "8px",
          }}
        >
          {salon.name}
        </h1>
        <p style={{ color: "#777", fontWeight: 300 }}>
          Gestão de Agenda & Relacionamento
        </p>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <KpiCard
          label="Atendimentos Hoje"
          value={todayAppointments}
          colors={colors}
        />

        {pendingConfirmations !== undefined && (
          <KpiCard
            label="Confirmações Pendentes"
            value={pendingConfirmations}
            highlight
            colors={colors}
          />
        )}

        {revenueToday !== undefined && (
          <KpiCard
            label="Receita Hoje"
            value={
              revenueToday === null ? "—" : `R$ ${revenueToday.toFixed(2)}`
            }
            colors={colors}
          />
        )}

        {birthdaysThisWeek !== undefined && (
          <KpiCard
            label="Aniversariantes"
            value={birthdaysThisWeek}
            colors={colors}
          />
        )}
      </div>

      {/* Ações globais */}
      {Object.keys(actions).length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {actions.onBlockAgenda && (
            <HeaderAction
              label="Bloquear Agenda"
              onClick={actions.onBlockAgenda}
              colors={colors}
            />
          )}

          {actions.onCreateCampaign && (
            <HeaderAction
              label="Criar Campanha"
              onClick={actions.onCreateCampaign}
              colors={colors}
            />
          )}

          {actions.onOpenSettings && (
            <HeaderAction
              label="Configurações"
              onClick={actions.onOpenSettings}
              colors={colors}
            />
          )}
        </div>
      )}
    </header>
  );
}

/* Subcomponentes */

function KpiCard({ label, value, highlight = false, colors }) {
  return (
    <div
      style={{
        backgroundColor: highlight ? colors.sageGreen : colors.offWhite,
        color: highlight ? "white" : colors.deepCharcoal,
        borderRadius: "16px",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.8rem", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function HeaderAction({ label, onClick, colors }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 18px",
        borderRadius: "20px",
        border: `1px solid ${colors.warmSand}`,
        backgroundColor: colors.offWhite,
        color: colors.deepCharcoal,
        cursor: "pointer",
        fontWeight: 500,
      }}
    >
      {label}
    </button>
  );
}
