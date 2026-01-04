import React from 'react';
import { Link } from 'react-router-dom';
import { Frown, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-surface flex flex-col items-center justify-center text-center p-4">
      <div className="bg-brand-card p-10 rounded-3xl shadow-2xl border border-brand-muted/10 max-w-md w-full">
        <Frown className="mx-auto text-brand-primary mb-6" size={64} strokeWidth={1.5} />
        <h1 className="text-5xl font-extrabold text-brand-text mb-2">404</h1>
        <h2 className="text-xl font-bold text-brand-text mb-4">Página Não Encontrada</h2>
        <p className="text-brand-muted mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20">
          <Home size={18} /> Voltar para o Início
        </Link>
      </div>
    </div>
  );
}