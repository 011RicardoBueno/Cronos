import React, { useState, useEffect, useRef } from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import Notifications from '@/components/dashboard/Notifications';
import { useAuth } from '@/context/AuthContext';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function DashboardHeader({ onOpenSidebar }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isTrialActive, trialDaysRemaining } = usePlanFeatures();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileRef]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';

  return (
    <header className="bg-brand-surface border-b border-brand-muted/10 sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
      {/* Trial Banner */}
      {isTrialActive && (
        <div className="hidden md:flex items-center gap-2">
          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
            AVALIAÇÃO
          </span>
          <span className="text-sm text-brand-muted">
            Você tem <span className="font-bold text-brand-text">{trialDaysRemaining}</span> dias restantes no seu teste gratuito.
          </span>
        </div>
      )}

      {/* Lado Esquerdo: Menu Mobile & Logo */}
      <div className="flex items-center gap-4 lg:hidden">
        <button 
          onClick={onOpenSidebar} 
          className="p-2 text-brand-text hover:bg-brand-muted/10 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-lg font-bold text-brand-primary uppercase tracking-wider">Cronos</h2>
      </div>

      {/* Lado Direito: Ações Globais */}
      <div className="flex items-center gap-4 ml-auto">
        <Notifications />

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-10 h-10 bg-brand-card border border-brand-muted/20 rounded-full flex items-center justify-center font-bold text-brand-primary hover:ring-2 hover:ring-brand-primary transition-all"
          >
            {userInitial}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-brand-card border border-brand-muted/20 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-4 border-b border-brand-muted/10">
                <p className="text-sm font-bold text-brand-text truncate">{user?.email}</p>
                <p className="text-xs text-brand-muted capitalize">{user?.user_metadata?.role || 'Usuário'}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    navigate('/minha-conta');
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-brand-text rounded-lg hover:bg-brand-surface transition-colors"
                >
                  <User size={16} /> Minha Conta
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={16} /> Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}