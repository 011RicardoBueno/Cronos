import React from 'react';
import { Phone } from 'lucide-react';
import FormInput from "@/components/ui/FormInput";

export default function SettingsContact({ values, handleChange, setFieldValue }) {
  return (
    <section className="bg-brand-card/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-brand-muted/10 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
          <Phone size={24} />
        </div>
        <h2 className="text-xl font-black text-brand-text">Contato</h2>
      </div>
      <div className="space-y-4">
        <FormInput
          name="phone"
          label="Telefone"
          placeholder="(00) 00000-0000"
          value={values.phone || ''}
          onChange={handleChange}
        />
        <FormInput
          name="instagram_user"
          label="Instagram"
          placeholder="seu_usuario"
          value={values.instagram_user || ''}
          onChange={e => setFieldValue('instagram_user', e.target.value.replace('@', ''))}
        />
      </div>
    </section>
  );
}