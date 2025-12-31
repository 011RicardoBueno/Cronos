import React from 'react';
import { Clock, User, Phone, MessageCircle, Trash2 } from 'lucide-react';
import { COLORS } from '../constants/dashboard';
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
    <div style={styles.card}>
      <div style={styles.timeInfo}>
        <Clock size={16} color={COLORS.sageGreen} />
        <span style={styles.timeText}>
          {moment(slot.start_time).format('HH:mm')} - {moment(slot.end_time).format('HH:mm')}
        </span>
      </div>

      <div style={styles.clientInfo}>
        <div style={styles.infoRow}>
          <User size={14} color="#888" />
          <span style={styles.clientName}>{slot.client_name || "Cliente sem nome"}</span>
        </div>
        
        {slot.services && (
          <div style={styles.serviceBadge}>
            {slot.services.name}
          </div>
        )}
      </div>

      <div style={styles.actions}>
        <button 
          onClick={handleWhatsAppClick}
          title="Chamar no WhatsApp"
          style={{...styles.iconBtn, backgroundColor: '#25D366', color: 'white', border: 'none'}}
        >
          <MessageCircle size={18} />
          <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>Chamar</span>
        </button>

        <button 
          onClick={() => onDelete(slot.id)}
          title="Excluir Agendamento"
          style={{...styles.iconBtn, color: '#e74c3c', borderColor: '#e74c3c'}}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '15px',
    marginBottom: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    borderLeft: `4px solid ${COLORS.sageGreen}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  timeInfo: { display: 'flex', alignItems: 'center', gap: '8px' },
  timeText: { fontWeight: 'bold', color: COLORS.deepCharcoal, fontSize: '0.95rem' },
  clientInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  clientName: { fontWeight: '500', color: '#444' },
  serviceBadge: {
    display: 'inline-block',
    fontSize: '0.75rem',
    backgroundColor: '#f0f0f0',
    padding: '2px 8px',
    borderRadius: '4px',
    color: '#666',
    alignSelf: 'flex-start',
    marginTop: '4px'
  },
  actions: { 
    display: 'flex', 
    gap: '10px', 
    marginTop: '5px',
    borderTop: '1px solid #f5f5f5',
    paddingTop: '10px'
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: '1px solid #ddd',
    transition: '0.2s'
  }
};

export default ProfessionalAgendaCard;