// components/dashboard/DashboardStates.jsx
export const LoadingState = () => (
  <div style={{ padding: 40, textAlign: "center" }}>
    Carregando painel...
  </div>
);

export const ErrorState = ({ message }) => (
  <div style={{ padding: 40, textAlign: "center", color: "red" }}>
    {message}
  </div>
);

export const NoSalonState = () => (
  <div style={{ padding: 40 }}>
    Salão não encontrado
  </div>
);
