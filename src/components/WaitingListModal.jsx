import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, User, Phone, Scissors, FileText, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import Button from './ui/Button';

export default function WaitingListModal({ isOpen, onClose, salonId, professionals, onUpdate }) {
  if (!isOpen) return null;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({
    client_name: '',
    client_phone: '',
    service_preference: '',
    professional_id: '',
    notes: ''
  });

  useEffect(() => {
    if (salonId) fetchList();
  }, [salonId]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('waiting_list')
        .select('*, professionals(name)')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar lista de espera');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.client_name) return;

    try {
      const { error } = await supabase.from('waiting_list').insert({
        salon_id: salonId,
        client_name: newItem.client_name,
        client_phone: newItem.client_phone,
        service_preference: newItem.service_preference,
        professional_id: newItem.professional_id || null,
        notes: newItem.notes
      });

      if (error) throw error;
      
      toast.success('Cliente adicionado à lista!');
      setNewItem({ client_name: '', client_phone: '', service_preference: '', professional_id: '', notes: '' });
      fetchList();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Erro ao adicionar: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remover da lista de espera?')) return;
    try {
      const { error } = await supabase.from('waiting_list').delete().eq('id', id);
      if (error) throw error;
      fetchList();
      if (onUpdate) onUpdate();
      toast.success('Removido com sucesso');
    } catch (error) {
      toast.error('Erro ao remover');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
      <div className="bg-brand-card w-full max-w-2xl m-4 rounded-3xl shadow-2xl border border-brand-muted/10 flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div className="p-6 border-b border-brand-muted/10 flex justify-between items-center">
          <h3 className="text-xl font-bold text-brand-text flex items-center gap-2">
            <Clock className="text-brand-primary" /> Lista de Espera
          </h3>
          <button onClick={onClose} className="p-2 text-brand-muted hover:bg-brand-surface rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Form */}
          <form onSubmit={handleAdd} className="bg-brand-surface p-4 rounded-2xl border border-brand-muted/10 mb-6">
            <h4 className="font-bold text-brand-text mb-4 text-sm uppercase">Novo Registro</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <input 
                  placeholder="Nome do Cliente"
                  value={newItem.client_name}
                  onChange={e => setNewItem({...newItem, client_name: e.target.value})}
                  className="w-full bg-brand-card border border-brand-muted/20 rounded-xl p-2 text-sm outline-none focus:border-brand-primary text-brand-text"
                  required
                />
              </div>
              <div>
                <input 
                  placeholder="Telefone / WhatsApp"
                  value={newItem.client_phone}
                  onChange={e => setNewItem({...newItem, client_phone: e.target.value})}
                  className="w-full bg-brand-card border border-brand-muted/20 rounded-xl p-2 text-sm outline-none focus:border-brand-primary text-brand-text"
                />
              </div>
              <div>
                <input 
                  placeholder="Serviço desejado (opcional)"
                  value={newItem.service_preference}
                  onChange={e => setNewItem({...newItem, service_preference: e.target.value})}
                  className="w-full bg-brand-card border border-brand-muted/20 rounded-xl p-2 text-sm outline-none focus:border-brand-primary text-brand-text"
                />
              </div>
              <div>
                <select 
                  value={newItem.professional_id}
                  onChange={e => setNewItem({...newItem, professional_id: e.target.value})}
                  className="w-full bg-brand-card border border-brand-muted/20 rounded-xl p-2 text-sm outline-none focus:border-brand-primary text-brand-text"
                >
                  <option value="">Qualquer Profissional</option>
                  {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <input 
                placeholder="Observações (ex: Só pode depois das 18h)"
                value={newItem.notes}
                onChange={e => setNewItem({...newItem, notes: e.target.value})}
                className="flex-1 bg-brand-card border border-brand-muted/20 rounded-xl p-2 text-sm outline-none focus:border-brand-primary text-brand-text"
              />
              <Button type="submit" className="px-6">
                <Plus size={18} /> Adicionar
              </Button>
            </div>
          </form>

          {/* List */}
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-brand-muted py-4">Carregando...</p>
            ) : items.length === 0 ? (
              <p className="text-center text-brand-muted py-8">A lista de espera está vazia.</p>
            ) : (
              items.map(item => (
                <div key={item.id} className="bg-brand-surface p-4 rounded-2xl border border-brand-muted/10 flex justify-between items-center group hover:border-brand-primary/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-brand-text">{item.client_name}</span>
                      {item.client_phone && <span className="text-xs text-brand-muted">({item.client_phone})</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-brand-muted">
                      {item.service_preference && (
                        <span className="flex items-center gap-1"><Scissors size={12} /> {item.service_preference}</span>
                      )}
                      {item.professionals?.name && (
                        <span className="flex items-center gap-1"><User size={12} /> {item.professionals.name}</span>
                      )}
                      {item.notes && (
                        <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded"><FileText size={12} /> {item.notes}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-brand-muted mt-1">
                      Aguardando desde {new Date(item.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {item.client_phone && (
                      <button 
                        onClick={() => {
                          const phone = item.client_phone.replace(/\D/g, "");
                          window.open(`https://wa.me/${phone.length <= 11 ? '55'+phone : phone}?text=Olá ${item.client_name}, surgiu um horário!`, '_blank');
                        }}
                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        title="Chamar no WhatsApp"
                      >
                        <Phone size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-brand-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}