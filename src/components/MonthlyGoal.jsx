import React, { useState, useEffect } from 'react';
import { Target, Edit2, Check, X, Trophy, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MonthlyGoal({ currentRevenue = 0 }) {
  const [goal, setGoal] = useState(5000);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [hasCelebrated, setHasCelebrated] = useState(false);

  useEffect(() => {
    const savedGoal = localStorage.getItem('salon_monthly_goal');
    if (savedGoal) {
      setGoal(Number(savedGoal));
    }
  }, []);

  useEffect(() => {
    if (currentRevenue >= goal && currentRevenue > 0 && !hasCelebrated) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF4500', '#32CD32', '#1E90FF']
      });
      setHasCelebrated(true);
    } else if (currentRevenue < goal) {
      setHasCelebrated(false);
    }
  }, [currentRevenue, goal, hasCelebrated]);

  const handleSave = () => {
    const newGoal = parseFloat(inputValue.replace(',', '.'));
    if (!isNaN(newGoal) && newGoal > 0) {
      setGoal(newGoal);
      localStorage.setItem('salon_monthly_goal', newGoal);
      setIsEditing(false);
    }
  };

  const startEditing = () => {
    setInputValue(goal.toString());
    setIsEditing(true);
  };

  const percentage = Math.min(100, (currentRevenue / goal) * 100);
  const remaining = Math.max(0, goal - currentRevenue);

  // Cálculo de meta diária
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, daysInMonth - today.getDate() + 1);
  const dailyNeeded = remaining / remainingDays;

  return (
    <div className="bg-brand-card rounded-3xl p-6 border border-brand-muted/10 relative overflow-hidden flex flex-col justify-between h-full">
      {/* Background decoration */}
      <div className="absolute -top-2 -right-2 p-4 opacity-[0.03] text-brand-text pointer-events-none">
        <Target size={100} />
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-600">
            <Trophy size={20} />
          </div>
          <h3 className="font-bold text-brand-text text-sm uppercase tracking-wider">Meta Mensal</h3>
        </div>
        
        {!isEditing ? (
          <button 
            onClick={startEditing}
            className="text-brand-muted hover:text-brand-primary transition-colors p-1"
            title="Definir Meta"
          >
            <Edit2 size={14} />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={handleSave} className="text-green-500 hover:bg-green-500/10 rounded p-1 transition-colors"><Check size={16} /></button>
            <button onClick={() => setIsEditing(false)} className="text-red-500 hover:bg-red-500/10 rounded p-1 transition-colors"><X size={16} /></button>
          </div>
        )}
      </div>

      <div className="relative z-10">
        {isEditing ? (
          <div className="animate-in fade-in zoom-in duration-200">
            <label className="text-xs text-brand-muted block mb-1 font-bold uppercase">Nova Meta (R$)</label>
            <input 
              autoFocus
              type="number" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl px-3 py-2 text-brand-text font-bold outline-none focus:border-brand-primary transition-all"
            />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-end mb-3">
              <div>
                <span className="text-3xl font-black text-brand-text">
                  {Math.round(percentage)}%
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-brand-muted mb-0.5">Meta: R$ {goal.toLocaleString('pt-BR')}</p>
            <div className="flex items-center justify-end gap-1">
              <p className="text-xs font-bold text-brand-primary">
                {remaining > 0 
                  ? `Faltam R$ ${remaining.toLocaleString('pt-BR')}` 
                  : 'Meta batida! 🎉'}
              </p>
              {remaining > 0 && (
                <Info size={14} className="text-brand-muted cursor-help hover:text-brand-primary transition-colors" title={`Meta diária: R$ ${dailyNeeded.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para os próximos ${remainingDays} dias.`} />
              )}
            </div>
              </div>
            </div>

            <div className="h-3 w-full bg-brand-surface rounded-full overflow-hidden border border-brand-muted/10">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${percentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}