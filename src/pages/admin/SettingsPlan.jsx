import React from 'react';
import { Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../../components/ui/Button';

export default function SettingsPlan({ currentPlan }) {
  const navigate = useNavigate();

  return (
    <section className="bg-gradient-to-br from-brand-primary/80 to-brand-primary p-8 rounded-[2.5rem] border border-brand-primary/50 text-white shadow-2xl shadow-brand-primary/20">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-white/20 rounded-2xl">
          <Star size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black">Seu Plano Atual</h2>
          <p className="text-white/80 text-sm capitalize font-bold">{currentPlan}</p>
        </div>
      </div>
      <p className="text-sm text-white/90 my-4">
        {currentPlan === 'iniciante' 
          ? 'Você está no plano gratuito. Faça upgrade para desbloquear relatórios avançados e integrações.'
          : 'Você tem acesso a todos os recursos avançados do Cronos.'
        }
      </p>
      <Button onClick={() => navigate('/planos')} variant="secondary" className="w-full bg-white text-brand-primary hover:bg-white/90">
        <Zap size={16} /> Fazer Upgrade
      </Button>
    </section>
  );
}