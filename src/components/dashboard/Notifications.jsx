import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertCircle, CalendarClock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const { salon } = useSalon();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (salon?.id) {
      fetchNotifications();
    }
  }, [salon?.id]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const fetchNotifications = async () => {
    try {
      const notifs = [];

      // 1. Agendamentos Pendentes
      const { data: pendingSlots } = await supabase
        .from('slots')
        .select('id, client_name, start_time')
        .eq('salon_id', salon.id)
        .eq('status', 'pending')
        .gte('start_time', moment().toISOString())
        .order('start_time', { ascending: true });

      if (pendingSlots) {
        pendingSlots.forEach(slot => {
          notifs.push({
            id: `slot-${slot.id}`,
            type: 'appointment',
            title: 'Agendamento Pendente',
            message: `${slot.client_name} - ${moment(slot.start_time).format('DD/MM HH:mm')}`,
            link: '/agenda',
            icon: <CalendarClock size={16} className="text-blue-500" />
          });
        });
      }

      // 2. Estoque Baixo (Verificação segura)
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id, name, stock_quantity')
        .eq('salon_id', salon.id)
        .lt('stock_quantity', 5) // Alerta se menor que 5 unidades
        .limit(5);

       if (lowStockProducts) {
         lowStockProducts.forEach(prod => {
           notifs.push({
             id: `prod-${prod.id}`,
             type: 'stock',
             title: 'Estoque Baixo',
             message: `${prod.name} tem apenas ${prod.stock_quantity} unidades.`,
             link: '/produtos',
             icon: <AlertCircle size={16} className="text-red-500" />
           });
         });
       }

      setNotifications(notifs);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-brand-muted hover:bg-brand-muted/10 rounded-full transition-colors"
      >
        <Bell size={24} />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-brand-surface">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-brand-card border border-brand-muted/20 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          <div className="p-4 border-b border-brand-muted/10 flex justify-between items-center">
            <h4 className="font-bold text-brand-text">Notificações</h4>
            <span className="text-xs text-brand-muted">{notifications.length} novas</span>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-brand-muted text-sm">
                Nenhuma notificação no momento.
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id}
                  onClick={() => {
                    navigate(notif.link);
                    setIsOpen(false);
                  }}
                  className="p-4 border-b border-brand-muted/5 hover:bg-brand-surface cursor-pointer transition-colors flex gap-3"
                >
                  <div className="mt-1 bg-brand-surface p-2 rounded-full h-fit border border-brand-muted/10">
                    {notif.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-text">{notif.title}</p>
                    <p className="text-xs text-brand-muted mt-0.5">{notif.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}