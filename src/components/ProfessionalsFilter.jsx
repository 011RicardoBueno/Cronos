export default function ProfessionalsFilter({
  professionals,
  selectedProfessionalId,
  setSelectedProfessionalId,
  colors,
}) {
  return (
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
        }}
      >
        Todos
      </button>

      {professionals.map(pro => (
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
          }}
        >
          {pro.name}
        </button>
      ))}
    </div>
  );
}
