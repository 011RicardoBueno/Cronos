import React from 'react';

export default function MyAccount() {
  return (
    <div className="min-h-screen bg-brand-surface p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-brand-text">Minha Conta</h2>
          <p className="text-sm text-brand-muted">Gerencie suas informações de perfil e configurações de acesso.</p>
        </header>
        <div className="bg-brand-card p-8 rounded-2xl border border-brand-muted/10">
          <p className="text-brand-text">Página de configurações da conta em desenvolvimento...</p>
        </div>
      </div>
    </div>
  );
}