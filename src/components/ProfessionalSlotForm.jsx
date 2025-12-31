import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { COLORS } from '../constants/dashboard';

export default function ProfessionalSlotForm({ services, onSubmit, initialDate, closingTime }) {
  const [formData, setFormData] = useState({
    client_name: '',
    service_id: '',
    start_time: initialDate ? moment(initialDate).format('YYYY-MM-DDTHH:mm') : '',
    end_time: ''
  });

  // Cálculo automático da hora de término baseado na duração do serviço
  useEffect(() => {
    if (formData.service_id && formData.start_time) {
      const selectedService = services.find(s => s.id === formData.service_id);
      if (selectedService) {
        const duration = selectedService.duration_minutes || 30; // 30min padrão se não houver
        const endTime = moment(formData.start_time).add(duration, 'minutes').format('YYYY-MM-DDTHH:mm');
        setFormData(prev => ({ ...prev, end_time: endTime }));
      }
    }
  }, [formData.service_id, formData.start_time, services]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.service_id || !formData.client_name) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    // Validação de horário de fechamento
    if (closingTime && formData.end_time) {
      const [closeHour, closeMinute] = closingTime.split(':');
      const endMoment = moment(formData.end_time);
      const limitMoment = moment(formData.end_time)
        .set('hour', parseInt(closeHour))
        .set('minute', parseInt(closeMinute));

      if (endMoment.isAfter(limitMoment)) {
        alert(`O serviço termina às ${endMoment.format('HH:mm')}, mas o salão fecha às ${closingTime}.`);
        return;
      }
    }

    // Enviamos os dados formatados para o banco de dados
    onSubmit({
      ...formData,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.sageGreen || '#ccc'}`,
    boxSizing: 'border-box'
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '10px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome do Cliente</label>
      <input
        type="text"
        placeholder="Ex: João Silva"
        style={inputStyle}
        value={formData.client_name}
        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
        required
      />

      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Serviço</label>
      <select
        style={inputStyle}
        value={formData.service_id}
        onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
        required
      >
        <option value="">Selecione um serviço...</option>
        {services?.map(s => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.duration_minutes} min)
          </option>
        ))}
      </select>

      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Início</label>
      <input
        type="datetime-local"
        style={inputStyle}
        value={formData.start_time}
        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
        required
      />

      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fim (Calculado)</label>
      <input
        type="datetime-local"
        style={{ ...inputStyle, backgroundColor: '#f9f9f9' }}
        value={formData.end_time}
        readOnly
      />

      <div style={{ marginBottom: '15px', fontSize: '0.85rem', color: '#666' }}>
        🕒 Encerramento do salão: <strong>{closingTime || '20:00'}</strong>
      </div>

      <button
        type="submit"
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: COLORS.deepCharcoal || '#333',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Confirmar Agendamento
      </button>
    </form>
  );
}