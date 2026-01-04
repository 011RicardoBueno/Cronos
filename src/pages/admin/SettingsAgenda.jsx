import React from 'react';
import { Calendar } from 'lucide-react';
import FormInput from '../../../../components/ui/FormInput';

export default function SettingsAgenda({ values, setFieldValue }) {
  return (
    <section className="bg-brand-card/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-brand-muted/10 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
          <Calendar size={24} />
        </div>
        <h2 className="text-xl font-black text-brand-text">Agenda</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Intervalo (min)"
          name="slot_interval"
          type="number"
          placeholder="30"
          value={values.slot_interval || ''}
          onChange={(e) => setFieldValue('slot_interval', Number(e.target.value))}
          helperText="Tempo padrão entre slots"
        />
        <FormInput
          label="Antecedência (horas)"
          name="min_booking_hours"
          type="number"
          placeholder="2"
          value={values.min_booking_hours || ''}
          onChange={(e) => setFieldValue('min_booking_hours', Number(e.target.value))}
          helperText="Mínimo para agendar online"
        />
      </div>
    </section>
  );
}