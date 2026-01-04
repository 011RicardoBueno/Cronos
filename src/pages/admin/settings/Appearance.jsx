import React from 'react';
import { Palette } from 'lucide-react';
import Button from "@/components/ui/Button";

export default function SettingsAppearance({ canUseCustomTheme, values, setFieldValue, themes }) {
  return (
    <section className="bg-brand-card/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-brand-muted/10 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
          <Palette size={24} />
        </div>
        <h2 className="text-xl font-black text-brand-text">Aparência</h2>
      </div>

      {canUseCustomTheme ? (
        <div className="grid grid-cols-1 gap-4">
          <label className="text-xs font-black uppercase text-brand-muted ml-1">Tema do Agendamento</label>
          <div className="flex flex-wrap gap-3">
            {themes.map((theme) => (
              <Button
                key={theme.id}
                variant="outline"
                size="custom"
                isActive={values.theme_name === theme.id}
                onClick={() => setFieldValue('theme_name', theme.id)}
                className="relative flex-col font-normal p-3 rounded-2xl"
              >
                <div className="flex -space-x-2">
                  {theme.colors.map((c, i) => <div key={c} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c, zIndex: 3-i }} />)}
                </div>
                <span className={`font-bold text-xs text-center ${values.theme_name === theme.id ? 'text-brand-primary' : 'text-brand-muted'}`}>{theme.name}</span>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center p-4 bg-brand-surface rounded-2xl border border-dashed border-brand-muted/20">
          <p className="text-sm text-brand-muted">Personalização de tema disponível nos planos <span className="font-bold text-brand-text">Profissional</span> e <span className="font-bold text-brand-text">Enterprise</span>.</p>
          <p className="text-xs text-brand-muted mt-1">Seu salão usará o tema padrão do Cronos.</p>
        </div>
      )}
    </section>
  );
}