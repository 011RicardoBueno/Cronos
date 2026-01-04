import React, { useState, useEffect, useCallback } from 'react';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { useNavigate } from 'react-router-dom';
import { X, Settings, Scissors, Users, Calendar, CheckCircle, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';

const checklistItems = [
    {
        icon: <Settings size={20} />,
        title: 'Configure seu Salão',
        description: 'Personalize horários, aparência e contato.',
        link: '/configuracoes',
        key: 'configuredSalon'
    },
    {
        icon: <Scissors size={20} />,
        title: 'Adicione seus Serviços',
        description: 'Cadastre os tratamentos que você oferece.',
        link: '/servicos',
        key: 'addedServices'
    },
    {
        icon: <Users size={20} />,
        title: 'Cadastre sua Equipe',
        description: 'Adicione os profissionais que trabalham com você.',
        link: '/profissionais',
        key: 'addedProfessionals'
    },
    {
        icon: <Calendar size={20} />,
        title: 'Faça o 1º Agendamento',
        description: 'Comece a organizar seus horários.',
        link: '/agenda',
        key: 'madeFirstAppointment'
    }
];

export default function OnboardingChecklist() {
    const { isTrialActive } = usePlanFeatures();
    const [isVisible, setIsVisible] = useState(false);
    const [completedSteps, setCompletedSteps] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const dismissed = localStorage.getItem('onboardingChecklistDismissed');
        const storedCompleted = JSON.parse(localStorage.getItem('onboardingCompletedSteps') || '{}');
        setCompletedSteps(storedCompleted);

        if (isTrialActive && !dismissed) {
            setIsVisible(true);
        }
    }, [isTrialActive]);

    const handleDismiss = useCallback(() => {
        localStorage.setItem('onboardingChecklistDismissed', 'true');
        setIsVisible(false);
    }, []);

    const handleNavigate = (link, key) => {
        const newCompleted = { ...completedSteps, [key]: true };
        setCompletedSteps(newCompleted);
        localStorage.setItem('onboardingCompletedSteps', JSON.stringify(newCompleted));
        navigate(link);
    };

    useEffect(() => {
        const allCompleted = checklistItems.every(item => completedSteps[item.key]);
        if (isVisible && allCompleted && Object.keys(completedSteps).length > 0) {
            // Trigger confetti celebration
            confetti({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.7 }
            });
            const timer = setTimeout(() => {
                handleDismiss();
            }, 3000); // Auto-dismiss after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [completedSteps, isVisible, handleDismiss]);

    if (!isVisible) return null;

    const pendingItems = checklistItems.filter(item => !completedSteps[item.key]);

    return (
        <div className="bg-brand-card border border-brand-muted/10 rounded-3xl p-6 mb-8 relative animate-in fade-in">
            <button onClick={handleDismiss} className="absolute top-4 right-4 p-1 text-brand-muted hover:text-brand-text transition-colors" title="Ocultar guia">
                <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-brand-text mb-1">Guia de Início Rápido</h3>
            <p className="text-sm text-brand-muted mb-6">Siga estes passos para configurar sua conta e aproveitar ao máximo o Cronos.</p>

            <div className="flex items-center gap-4 mb-4">
                <div className="w-full bg-brand-surface rounded-full h-2.5 border border-brand-muted/10">
                    <div 
                        className="bg-brand-primary h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${(Object.keys(completedSteps).length / checklistItems.length) * 100}%` }}
                    ></div>
                </div>
                <span className="text-sm font-bold text-brand-text">
                    {Object.keys(completedSteps).length}/{checklistItems.length}
                </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {pendingItems.length > 0 ? (
                    pendingItems.map(item => (
                        <div 
                            key={item.key}
                            onClick={() => handleNavigate(item.link, item.key)}
                            className="bg-brand-surface p-4 rounded-2xl border border-brand-muted/10 hover:border-brand-primary hover:bg-brand-primary/5 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-brand-primary/10 text-brand-primary p-2 rounded-lg">
                                    {item.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-brand-text text-sm">{item.title}</h4>
                                    <p className="text-xs text-brand-muted">{item.description}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center p-6 animate-in fade-in">
                        <PartyPopper size={40} className="mx-auto text-brand-primary mb-4" />
                        <h4 className="font-bold text-lg text-brand-text">Tudo pronto!</h4>
                        <p className="text-brand-muted text-sm">Você configurou o básico. Agora explore o resto do Cronos!</p>
                    </div>
                )}
            </div>
        </div>
    );
}