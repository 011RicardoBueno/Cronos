import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Edit3, Trash2, User, Briefcase, X, Check, Save, Loader2 } from 'lucide-react';

export default function Professionals() {
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar_url: '',
    commission_rate: 0,
    serviceIds: []
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchProfessionals();
    fetchServices();
  }, []);

  async function fetchProfessionals() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchServices() {
    const { data } = await supabase.from('services').select('*').order('name');
    setServices(data || []);
  }

  const handleOpenModal = async (pro = null) => {
    if (pro) {
      setEditingId(pro.id);
      // Fetch linked services
      const { data: linked } = await supabase
        .from('professional_services')
        .select('service_id')
        .eq('professional_id', pro.id);
      
      const linkedIds = linked ? linked.map(l => l.service_id) : [];

      setFormData({
        name: pro.name,
        bio: pro.bio || '',
        avatar_url: pro.avatar_url || '',
        commission_rate: pro.commission_rate || 0,
        serviceIds: linkedIds
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        bio: '',
        avatar_url: '',
        commission_rate: 0,
        serviceIds: []
      });
    }
    setFormErrors({}); // Clear previous errors
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;

    if (!formData.name.trim()) {
      errors.name = 'O nome é obrigatório.';
    } else if (!nameRegex.test(formData.name)) {
      errors.name = 'O nome deve conter apenas letras e espaços.';
    }

    if (formData.commission_rate < 0 || formData.commission_rate > 100) {
      errors.commission_rate = 'A comissão deve ser entre 0 e 100.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Infer salon_id from services if available (fallback)
      let salonId = null;
      if (services.length > 0) salonId = services[0].salon_id;

      const payload = {
        name: formData.name,
        bio: formData.bio,
        avatar_url: formData.avatar_url,
        commission_rate: formData.commission_rate,
        ...(salonId && !editingId ? { salon_id: salonId } : {})
      };

      let proId = editingId;

      if (editingId) {
        const { error } = await supabase.from('professionals').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('professionals').insert([payload]).select();
        if (error) throw error;
        proId = data[0].id;
      }

      // Update Services Linkage
      await supabase.from('professional_services').delete().eq('professional_id', proId);
      
      if (formData.serviceIds.length > 0) {
        const links = formData.serviceIds.map(sid => ({
          professional_id: proId,
          service_id: sid
        }));
        const { error: linkError } = await supabase.from('professional_services').insert(links);
        if (linkError) throw linkError;
      }

      setIsModalOpen(false);
      fetchProfessionals();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfessional = async (proId) => {
    if (!window.confirm('Tem certeza que deseja excluir este profissional? Esta ação não pode ser desfeita e removerá o profissional de agendamentos futuros.')) {
      return;
    }

    try {
      // First, delete dependencies in the junction table to maintain data integrity.
      const { error: junctionError } = await supabase
        .from('professional_services')
        .delete()
        .eq('professional_id', proId);

      if (junctionError) throw junctionError;

      // Then, delete the professional from the main table.
      const { error: proError } = await supabase
        .from('professionals')
        .delete()
        .eq('id', proId);

      if (proError) throw proError;

      // Update state locally to reflect the change immediately in the UI.
      setProfessionals(prev => prev.filter(p => p.id !== proId));
      alert('Profissional excluído com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir profissional:', error);
      alert(`Não foi possível excluir o profissional: ${error.message}`);
    }
  };

  const toggleService = (id) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(id) 
        ? prev.serviceIds.filter(sid => sid !== id)
        : [...prev.serviceIds, id]
    }));
  };

  const filteredProfessionals = professionals.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-brand-surface p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-text">Profissionais</h2>
            <p className="text-sm text-brand-muted">Gerencie sua equipe e comissões</p>
          </div>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20">
            <Plus size={20} /> Novo Profissional
          </button>
        </header>

        {/* BUSCA */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-card border border-brand-muted/20 rounded-2xl py-3 pl-12 pr-4 text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
          />
        </div>

        {/* GRID DE CARDS */}
        {loading ? (
          <div className="text-center p-10 text-brand-muted animate-pulse">Carregando equipe...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProfessionals.map((pro) => (
              <div key={pro.id} className="bg-brand-card rounded-3xl border border-brand-muted/20 p-6 hover:shadow-xl transition-all group text-center">
                
                {/* AVATAR */}
                <div className="w-24 h-24 mx-auto rounded-full bg-brand-surface border-2 border-brand-primary/30 p-1 mb-4 overflow-hidden flex items-center justify-center">
                  {pro.avatar_url ? (
                    <img src={pro.avatar_url} alt={pro.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User size={40} className="text-brand-muted/50" />
                  )}
                </div>

                {/* INFO */}
                <h3 className="text-brand-text font-bold text-xl mb-1">{pro.name}</h3>
                <p className="text-brand-muted text-sm flex items-center justify-center gap-1">
                   {pro.bio || 'Especialista'}
                </p>

                {/* COMISSÃO */}
                <div className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-xs font-bold inline-block mt-2">
                  Comissão: {pro.commission_rate || 0}%
                </div>

                {/* ACTIONS */}
                <div className="flex justify-center gap-3 mt-6 pt-4 border-t border-brand-muted/10">
                  <button onClick={() => handleOpenModal(pro)} className="p-2 rounded-lg text-brand-muted hover:text-brand-primary transition-colors hover:bg-brand-surface">
                    <Edit3 size={20} />
                  </button>
                  <button onClick={() => handleDeleteProfessional(pro.id)} className="p-2 rounded-lg text-brand-muted hover:text-red-500 transition-colors hover:bg-brand-surface">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredProfessionals.length === 0 && (
          <div className="bg-brand-card rounded-3xl p-12 text-center border border-brand-muted/10">
            <Briefcase size={48} className="mx-auto text-brand-muted/30 mb-4" />
            <h3 className="text-brand-text font-bold text-lg">Nenhum profissional encontrado</h3>
            <p className="text-brand-muted text-sm">Cadastre sua equipe para começar.</p>
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO/CRIAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-brand-card w-full max-w-2xl rounded-3xl shadow-2xl border border-brand-muted/20 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-brand-muted/10 flex justify-between items-center sticky top-0 bg-brand-card z-10">
              <h3 className="text-xl font-bold text-brand-text">{editingId ? 'Editar Profissional' : 'Novo Profissional'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-brand-surface rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-brand-surface border-2 border-brand-primary/20 overflow-hidden flex items-center justify-center relative group">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-brand-muted/50" />
                  )}
                </div>
                <div className="w-full max-w-sm">
                  <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">URL do Avatar</label>
                  <input 
                    value={formData.avatar_url}
                    onChange={e => setFormData({...formData, avatar_url: e.target.value})}
                    placeholder="https://..."
                    className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 text-sm outline-none focus:border-brand-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Nome Completo</label>
                  <input 
                    value={formData.name}
                    onChange={e => { setFormData({...formData, name: e.target.value }); if(formErrors.name) validateForm(); }}
                    className={`w-full bg-brand-surface border rounded-xl p-3 outline-none focus:border-brand-primary transition-all ${formErrors.name ? 'border-red-500' : 'border-brand-muted/20'}`}
                  />
                  {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Especialidade (Cargo)</label>
                  <input 
                    value={formData.bio} // Using bio field for specialty as per schema
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    placeholder="Ex: Cabeleireiro Senior"
                    className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 outline-none focus:border-brand-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                 <div>
                  <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Comissão (%)</label>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={formData.commission_rate}
                    onChange={e => { setFormData({...formData, commission_rate: parseFloat(e.target.value) || 0 }); if(formErrors.commission_rate) validateForm(); }}
                    className={`w-full bg-brand-surface border rounded-xl p-3 outline-none focus:border-brand-primary transition-all ${formErrors.commission_rate ? 'border-red-500' : 'border-brand-muted/20'}`}
                  />
                  {formErrors.commission_rate && <p className="text-xs text-red-500 mt-1">{formErrors.commission_rate}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-brand-muted uppercase mb-2 block">Serviços Realizados</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-brand-surface rounded-xl border border-brand-muted/10">
                  {services.map(service => (
                    <label key={service.id} className="flex items-center gap-3 p-2 hover:bg-brand-card rounded-lg cursor-pointer transition-colors">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.serviceIds.includes(service.id) ? 'bg-brand-primary border-brand-primary' : 'border-brand-muted/40'}`}>
                        {formData.serviceIds.includes(service.id) && <Check size={14} className="text-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={formData.serviceIds.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                      />
                      <span className="text-sm font-medium text-brand-text">{service.name}</span>
                    </label>
                  ))}
                  {services.length === 0 && <p className="text-sm text-brand-muted p-2">Nenhum serviço cadastrado.</p>}
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-brand-muted/10 flex justify-end gap-3 bg-brand-card sticky bottom-0 rounded-b-3xl">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-brand-muted hover:bg-brand-surface transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-3 rounded-xl font-bold bg-brand-primary text-white hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2">
                {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Salvar Profissional</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}