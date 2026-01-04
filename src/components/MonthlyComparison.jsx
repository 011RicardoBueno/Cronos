import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MonthlyComparison({ title, current, previous, isCurrency = true }) {
  const safeCurrent = Number(current) || 0;
  const safePrevious = Number(previous) || 0;
  const diff = safeCurrent - safePrevious;
  
  let percentage = 0;
  if (safePrevious !== 0) {
    percentage = (diff / safePrevious) * 100;
  } else if (safeCurrent !== 0) {
    percentage = 100;
  }

  const isPositive = diff > 0;
  const isNeutral = diff === 0;
  
  const formatValue = (val) => {
    return isCurrency 
      ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : val;
  };

  return (
    <div className="bg-brand-card rounded-2xl p-5 border border-brand-muted/10 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">{title}</span>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
          isNeutral ? 'bg-gray-100 text-gray-600' :
          isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {isNeutral ? <Minus size={12} /> : isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{Math.abs(percentage).toFixed(1)}%</span>
        </div>
      </div>
      
      <div>
        <h4 className="text-lg font-black text-brand-text">{formatValue(safeCurrent)}</h4>
        <p className="text-xs text-brand-muted mt-1">vs {formatValue(safePrevious)} (anterior)</p>
      </div>
    </div>
  );
}