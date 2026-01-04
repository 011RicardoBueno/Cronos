import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import TrialEndModal from '../TrialEndModal';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { plan, isTrialActive } = usePlanFeatures();
  const [isTrialEndModalOpen, setIsTrialEndModalOpen] = useState(false);

  useEffect(() => {
    // Check if trial has ended, user is on the free plan, and modal hasn't been shown this session
    if (isTrialActive === false && plan === 'iniciante') {
      const modalShown = sessionStorage.getItem('trialEndModalShown');
      if (!modalShown) {
        setIsTrialEndModalOpen(true);
      }
    }
  }, [isTrialActive, plan]);

  const handleCloseTrialModal = () => {
    sessionStorage.setItem('trialEndModalShown', 'true');
    setIsTrialEndModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-brand-surface text-brand-text">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="lg:ml-64 min-h-screen transition-all duration-300 flex flex-col">
        <DashboardHeader onOpenSidebar={() => setIsSidebarOpen(true)} />
        
        <main className="p-4 md:p-8 flex-1">
          {children || <Outlet />}
        </main>
      </div>

      <TrialEndModal 
        isOpen={isTrialEndModalOpen}
        onClose={handleCloseTrialModal}
      />
    </div>
  );
}