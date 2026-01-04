import React from 'react';
import { useSalon } from '../../context/SalonContext';
import { Check, Star, Zap } from 'lucide-react';
import Button from '../../components/ui/Button';

const plans = [
  {
    name: 'Iniciante',
    price: 'R$ 0',
    description: 'Para quem está começando e quer organizar a agenda.',
    features: [
      'Agenda Digital',
      'Cadastro de Clientes',
      'Cadastro de Serviços',
      'Até 2 Profissionais',
    ],
    isPopular: false,
  },
  {
    name: 'Profissional',
    price: 'R$ 49,90',
    priceSuffix: '/mês',
    description: 'Para negócios que buscam crescimento e inteligência financeira.',
    features: [
      'Tudo do plano Iniciante',
      'Módulo Financeiro Completo',
      'Relatórios Avançados (PRO)',
      'Metas e Previsões',
      'Até 10 Profissionais',
    ],
    isPopular: true,
  },
  {
    name: 'Enterprise',
    price: 'R$ 99,90',
    priceSuffix: '/mês',
    description: 'Para escalar seu negócio com integrações e automação.',
    features: [
      'Tudo do plano Profissional',
      'Acesso à API',
      'Integração com Zapier',
      'Suporte Prioritário',
      'Profissionais Ilimitados',
    ],
    isPopular: false,
  },
];

const PlanCard = ({ plan, currentPlan }) => {
  const isCurrent = plan.name.toLowerCase() === currentPlan;

  return (
    <div className={`
      bg-brand-card rounded-3xl p-8 border
      ${plan.isPopular ? 'border-brand-primary shadow-2xl shadow-brand-primary/10' : 'border-brand-muted/10'}
      ${isCurrent && 'ring-2 ring-brand-primary ring-offset-4 ring-offset-brand-surface'}
    `}>
      {plan.isPopular && (
        <div className="text-center mb-4">
          <span className="bg-brand-primary text-white text-xs font-bold px-3 py-1 rounded-full">Mais Popular</span>
        </div>
      )}
      <h3 className="text-2xl font-bold text-brand-text text-center">{plan.name}</h3>
      <p className="text-brand-muted text-center text-sm h-10">{plan.description}</p>
      
      <div className="text-center my-6">
        <span className="text-5xl font-black text-brand-text">{plan.price}</span>
        {plan.priceSuffix && <span className="text-brand-muted font-semibold">{plan.priceSuffix}</span>}
      </div>

      <Button 
        className="w-full mb-8"
        variant={isCurrent ? 'secondary' : 'primary'}
        disabled={isCurrent}
      >
        {isCurrent ? 'Seu Plano Atual' : 'Fazer Upgrade'}
      </Button>

      <ul className="space-y-3">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3 text-sm">
            <Check size={16} className="text-green-500 flex-shrink-0" />
            <span className="text-brand-text">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function PricingPage() {
  const { salon } = useSalon();
  const currentPlan = salon?.plan_type || 'iniciante';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="text-center">
        <h1 className="text-4xl font-black text-brand-text tracking-tight flex items-center justify-center gap-3">
          <Star className="text-brand-primary" />
          Nossos Planos
        </h1>
        <p className="text-brand-muted mt-2 max-w-2xl mx-auto">
          Escolha o plano que melhor se adapta ao momento do seu negócio. Cancele quando quiser.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
        {plans.map(plan => (
          <PlanCard key={plan.name} plan={plan} currentPlan={currentPlan} />
        ))}
      </div>
    </div>
  );
}