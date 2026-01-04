import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

export default function ProfessionalFormModal({ professional, onClose, onSave }) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [commissionRate, setCommissionRate] = useState(0);
  const [services, setServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (professional) {
      setName(professional.name || '');
      setBio(professional.bio || '');
      setAvatarUrl(professional.avatar_url || '');
      setCommissionRate(professional.commission_rate || 0);
      // Fetch professional's services
      fetchProfessionalServices(professional.id);
    }
    // Fetch all services
    fetchAllServices();
  }, [professional]);

  async function fetchAllServices() {
    try {
      const { data, error } = await supabase.from('services').select('*');
      if (error) throw error;
      setAllServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  }

  async function fetchProfessionalServices(professionalId) {
    try {
      const { data, error } = await supabase
        .from('professional_services')
        .select('service_id')
        .eq('professional_id', professionalId);
      if (error) throw error;
      setServices(data.map(ps => ps.service_id));
    } catch (error) {
      console.error('Error fetching professional services:', error);
    }
  }

  const handleServiceChange = (serviceId) => {
    setServices(prevServices =>
      prevServices.includes(serviceId)
        ? prevServices.filter(id => id !== serviceId)
        : [...prevServices, serviceId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const professionalData = {
      name,
      bio,
      avatar_url: avatarUrl,
      commission_rate: commissionRate,
    };

    let savedProfessional;

    try {
      if (professional) {
        // Update
        const { data, error } = await supabase
          .from('professionals')
          .update(professionalData)
          .eq('id', professional.id)
          .select()
          .single();
        if (error) throw error;
        savedProfessional = data;
      } else {
        // Create
        const { data, error } = await supabase
          .from('professionals')
          .insert(professionalData)
          .select()
          .single();
        if (error) throw error;
        savedProfessional = data;
      }

      // Handle services
      if (savedProfessional) {
        // Remove existing services
        const { error: deleteError } = await supabase
          .from('professional_services')
          .delete()
          .eq('professional_id', savedProfessional.id);
        if (deleteError) throw deleteError;

        // Add selected services
        const servicesToInsert = services.map(serviceId => ({
          professional_id: savedProfessional.id,
          service_id: serviceId,
        }));
        const { error: insertError } = await supabase
          .from('professional_services')
          .insert(servicesToInsert);
        if (insertError) throw insertError;
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving professional:', error);
      // Here you might want to show an error to the user
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-brand-card rounded-3xl border border-brand-muted/20 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-brand-surface transition-colors">
          <X size={24} className="text-brand-muted" />
        </button>
        <h2 className="text-2xl font-bold text-brand-text mb-6">{professional ? 'Editar Profissional' : 'Novo Profissional'}</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 flex-shrink-0 rounded-full bg-brand-surface border-2 border-brand-primary/30 overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-brand-muted text-center">Preview</span>
              )}
            </div>
            <div className="w-full">
              <label htmlFor="avatarUrl" className="block text-sm font-medium text-brand-muted mb-1">URL do Avatar</label>
              <input 
                id="avatarUrl"
                type="text" 
                value={avatarUrl} 
                onChange={(e) => setAvatarUrl(e.target.value)} 
                placeholder="https://exemplo.com/avatar.png"
                className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl py-2 px-4 text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-brand-muted mb-1">Nome</label>
            <input 
              id="name"
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="Nome do profissional"
              className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl py-2 px-4 text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/50"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-brand-muted mb-1">Bio</label>
            <textarea 
              id="bio"
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              rows="3"
              placeholder="Uma breve descrição sobre o profissional..."
              className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl py-2 px-4 text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/50"
            ></textarea>
          </div>

          <div>
            <label htmlFor="commission" className="block text-sm font-medium text-brand-muted mb-1">Comissão (%)</label>
            <input 
              id="commission"
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
              placeholder="Ex: 20"
              className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl py-2 px-4 text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/50"
            />
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-brand-text mb-2">Serviços Prestados</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl bg-brand-surface border border-brand-muted/10 max-h-48 overflow-y-auto">
              {allServices.length > 0 ? allServices.map(service => (
                <label key={service.id} className="flex items-center gap-2 text-brand-text cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={services.includes(service.id)}
                    onChange={() => handleServiceChange(service.id)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  {service.name}
                </label>
              )) : <p className="text-brand-muted text-sm">Nenhum serviço cadastrado.</p>}
            </div>
          </div>
          
          <div className="flex justify-end gap-4 mt-4">
            <button type="button" onClick={onClose} className="text-brand-muted font-bold py-2 px-4 rounded-xl hover:bg-brand-surface transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="bg-brand-primary text-white font-bold py-2 px-6 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-brand-primary/20 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
