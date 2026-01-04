import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext();

export function Tabs({ defaultValue, children, className = '' }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = '' }) {
  return (
    <div className={`flex p-1.5 bg-brand-surface rounded-2xl border border-brand-muted/10 mb-8 overflow-x-auto ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className = '' }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${
        isActive
          ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-[1.02]'
          : 'text-brand-muted hover:text-brand-text hover:bg-brand-muted/5'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = '' }) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;
  
  return (
    <div 
      key={value}
      className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out ${className}`}
    >
      {children}
    </div>
  );
}