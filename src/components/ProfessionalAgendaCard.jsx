import React from 'react';
import { Clock, User, Phone, MessageCircle, Trash2 } from 'lucide-react';
import moment from 'moment';

const ProfessionalAgendaCard = ({ slot, onDelete }) => {
  // Função para formatar o link do WhatsApp
  const handleWhatsAppClick = () => {
    if (!slot.client_phone) {
      alert("Telefone do cliente não encontrado.");
      return;
    }

    // Limpa o número (remove ( ) - e espaços)
    const cleanNumber = slot.client_phone.replace(/\D/g, "");
    // Adiciona código do país se necessário
    const finalNumber = cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;
    
    const message = encodeURIComponent(
      `Olá ${slot.client_name}! Confirmo seu agendamento de ${slot.services?.name} para ${moment(slot.start_time).format('DD/MM')} às ${moment(slot.start_time).format('HH:mm')}. Podemos confirmar?`
    );

    window.open(`https://wa.me/${finalNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="bg-brand-card/80 backdrop-blur-sm rounded-lg p-3 shadow-lg border-l-4 border-brand-primary flex flex-col gap-3 text-left">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-brand-primary flex-shrink-0" />
        <span className="text-xs font-bold text-brand-text">
          {moment(slot.start_time).format('HH:mm')} - {moment(slot.end_time).format('HH:mm')}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <User size={14} className="text-brand-muted flex-shrink-0" />
          <span className="text-sm font-medium text-brand-text truncate">{slot.client_name || "Cliente sem nome"}</span>
        </div>
        
        {slot.services && (
          <div className="text-xs bg-brand-surface px-2 py-1 rounded self-start ml-6">
            {slot.services.name}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-auto pt-2 border-t border-brand-muted/10">
        <button 
          onClick={handleWhatsAppClick}
          title="Chamar no WhatsApp"
          className="flex-1 flex items-center justify-center gap-1.5 p-1.5 rounded-md bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-all text-xs"
        >
          <MessageCircle size={18} />
        </button>
      </div>
    </div>
  );
};

export default ProfessionalAgendaCard;