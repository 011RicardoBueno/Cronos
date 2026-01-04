import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ 
  title, 
  description, 
  icon: Icon = Inbox, 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in duration-300">
      <div className="bg-brand-surface p-6 rounded-full mb-6 border border-brand-muted/10 shadow-sm">
        <Icon size={48} className="text-brand-muted/50" />
      </div>
      <h3 className="text-xl font-bold text-brand-text mb-2">{title}</h3>
      <p className="text-brand-muted max-w-md mb-8 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}