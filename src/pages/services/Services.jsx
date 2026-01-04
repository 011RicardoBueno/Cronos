import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { Trash2, Plus, Clock, DollarSign, X, Scissors, Save, Loader2 } from 'lucide-react';

export default function Servicos() {
  const { salon, services, refreshSalon, loading: loadingContext } = useSalon();
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estado para o novo serviço
  const [newService, setNewService] = useState({
    name: '',
    duration_minutes: 30,
    price: 0
  });

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!salon?.id) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('services')
        .insert([{ 
          name: newService.name.trim(),
          duration_minutes: Number(newService.duration_minutes),
          price: parseFloat(newService.price.toString().replace(',', '.')),
          salon_id: salon.id 
        }]);

      if (error) throw error;
      
      setNewService({ name: '', duration_minutes: 30, price: 0 });
      setIsAdding(false);
      await refreshSalon(); // Atualiza o SalonContext global
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar serviço: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja eliminar este serviço? Isso não afetará agendamentos já realizados.")) return;
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await refreshSalon();
    } catch (err) {
      console.error(err);
      alert("Erro ao eliminar serviço: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-text flex items-center gap-2">
              <Scissors className="text-brand-primary" size={24} /> Gestão de Serviços
            </h2>
            <p className="text-sm text-brand-muted">{salon?.name}</p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg ${
              isAdding 
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                : 'bg-brand-primary text-white hover:opacity-90 shadow-brand-primary/20'
            }`}
          >
            {isAdding ? <X size={20} /> : <Plus size={20} />}
            {isAdding ? 'Cancelar' : 'Novo Serviço'}
          </button>
        </header>

        {isAdding && (
          <form onSubmit={handleAddService} className="bg-brand-card border border-brand-muted/20 rounded-3xl p-6 mb-8 shadow-xl animate-in fade-in slide-in-from-top-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Nome do Serviço</label>
              <input 
                placeholder="Ex: Corte Degradê + Barba"
                value={newService.name}
                onChange={e => setNewService({...newService, name: e.target.value})}
                required
                disabled={saving}
                className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 outline-none focus:border-brand-primary transition-all text-brand-text"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Duração (min)</label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input 
                    type="number"
                    min="1"
                    value={newService.duration_minutes}
                    onChange={e => setNewService({...newService, duration_minutes: e.target.value})}
                    disabled={saving}
                    className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 pl-10 outline-none focus:border-brand-primary transition-all text-brand-text"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Preço (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted font-bold text-sm">R$</span>
                  <input 
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={newService.price}
                    onChange={e => setNewService({...newService, price: e.target.value})}
                    disabled={saving}
                    className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 pl-10 outline-none focus:border-brand-primary transition-all text-brand-text"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Salvar Serviço</>}
            </button>
          </form>
        )}

        {(loadingContext && services.length === 0) ? (
          <div className="text-center p-10 text-brand-muted animate-pulse">Carregando serviços...</div>
        ) : (
          <div className="grid gap-4">
            {services.map(service => (
              <div key={service.id} className="bg-brand-card p-5 rounded-2xl border border-brand-muted/20 flex justify-between items-center hover:shadow-md transition-all group">
                <div>
                  <h4 className="text-lg font-bold text-brand-text mb-1">{service.name}</h4>
                  <div className="flex gap-4 text-sm text-brand-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={14} className="text-brand-primary" /> {service.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-brand-text">
                      <DollarSign size={14} className="text-brand-primary" /> R$ {Number(service.price).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(service.id)}
                  className="p-2 rounded-xl text-brand-muted hover:text-red-500 hover:bg-brand-surface transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {services.length === 0 && !isAdding && (
              <div className="text-center p-12 bg-brand-card rounded-3xl border border-brand-muted/10">
                <p className="text-brand-muted">Você ainda não cadastrou nenhum serviço.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}