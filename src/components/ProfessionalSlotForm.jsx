import React, { useState, useEffect } from 'react';
import moment from 'moment';

export default function ProfessionalSlotForm({ services, onSubmit, initialDate, closingTime }) {
  const [formData, setFormData] = useState({
    client_name: '',
    service_id: '',
    start_time: initialDate ? moment(initialDate).format('YYYY-MM-DDTHH:mm') : '',
    end_time: ''
  });

  useEffect(() => {
    if (formData.service_id && formData.start_time) {
      const selectedService = services.find(s => s.id === formData.service_id);
      if (selectedService) {
        const duration = selectedService.duration_minutes;
        const endTime = moment(formData.start_time).add(duration, 'minutes').format('YYYY-MM-DDTHH:mm');
        setFormData(prev => ({ ...prev, end_time: endTime }));
      }
    }
  }, [formData.service_id, formData.start_time, services]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Lógica da trava de segurança (Horário de Fechamento)
    if (closingTime && formData.end_time) {
      const [closeHour, closeMinute] = closingTime.split(':');
      const endMoment = moment(formData.end_time);
      
      // Criamos um objeto moment para o limite do dia do agendamento
      const limitMoment = moment(formData.end_time)
        .set('hour', parseInt(closeHour))
        .set('minute', parseInt(closeMinute))
        .set('second', 0);

      if (endMoment.isAfter(limitMoment)) {
        alert(`Operação Inválida: Este serviço termina às ${endMoment.format('HH:mm')}, mas o salão fecha às ${closingTime}.`);
        return;
      }
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ /* seus estilos atuais */ }}>
      {/* ... campos de input (iguais ao anterior) ... */}
      
      <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666' }}>
        * O encerramento do salão é às <strong>{closingTime || '20:00'}</strong>.
      </div>

      <button type="submit" style={{ /* seus estilos */ }}>
        Agendar Cliente
      </button>
    </form>
  );
}