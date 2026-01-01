import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-brand-muted hover:text-brand-primary hover:bg-brand-primary/10 transition-all duration-200 group mb-4"
    >
      <ArrowLeft 
        size={20} 
        className="transition-transform group-hover:-translate-x-1" 
      />
      <span className="font-medium">Voltar</span>
    </button>
  );
}
