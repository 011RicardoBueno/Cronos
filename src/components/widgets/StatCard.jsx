import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'gray' }) => {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-500',
    red: 'bg-red-500/10 text-red-500',
    blue: 'bg-blue-500/10 text-blue-500',
    primary: 'bg-brand-primary/10 text-brand-primary',
  };

  const borderClass = color === 'primary' ? 'border-2 border-brand-primary' : 'border border-brand-muted/20';

  return (
    <div className={`bg-brand-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${borderClass}`}>
      <div className={`p-3 rounded-xl w-fit mb-4 ${colorClasses[color]}`}>
        <Icon size={24} />
      </div>
      <span className="text-sm font-medium text-brand-muted">{title}</span>
      <h2 className={`text-2xl font-bold mt-1 ${color === 'primary' ? 'text-brand-primary' : 'text-brand-text'}`}>
        {value}
      </h2>
    </div>
  );
};

export default StatCard;