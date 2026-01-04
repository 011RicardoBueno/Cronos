import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Zap } from 'lucide-react';
import Button from './ui/Button';

export default function TrialEndModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    navigate('/planos');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
      <div className="bg-brand-card p-8 rounded-3xl w-full max-w-md m-4 relative shadow-2xl border border-brand-muted/10 animate-in zoom-in-95 text-center">
        <div className="w-16 h-16 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star size={32} />
        </div>
        
        <h3 className="text-2xl font-black text-brand-text mb-2">Sua avaliação terminou!</h3>
        <p className="text-brand-muted mb-6">
          Esperamos que tenha gostado dos recursos PRO. Para continuar usando o Hub de Inteligência, relatórios avançados e integrações, escolha um plano.
        </p>

        <div className="space-y-3">
          <Button 
            onClick={handleUpgrade}
            className="w-full"
          >
            <Zap size={18} /> Ver Planos e Fazer Upgrade
          </Button>
          <Button 
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            Continuar no plano gratuito
          </Button>
        </div>
      </div>
    </div>
  );
}