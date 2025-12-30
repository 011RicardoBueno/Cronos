import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { COLORS } from '../../constants/dashboard';
import BackButton from '../../components/ui/BackButton';
import { Trash2, Plus, Clock, DollarSign } from 'lucide-react';

export default function Servicos() {
  const { salon } = useSalon();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Estado para o novo serviço
  const [newService, setNewService] = useState({
    name: '',
    duration_minutes: 30,
    price: 0
  });

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('services')
        .insert([{ 
          ...newService, 
          salon_id: salon?.id 
        }]);

      if (error) throw error;
      
      setNewService({ name: '', duration_minutes: 30, price: 0 });
      setIsAdding(false);
      fetchServices();
    } catch (err) {
      alert("Erro ao salvar serviço");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja eliminar este serviço?")) return;
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      fetchServices();
    } catch (err) {
      alert("Erro ao eliminar serviço");
    }
  };

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <BackButton colors={COLORS} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
          <h2 style={{ color: COLORS.deepCharcoal, margin: 0 }}>Serviços</h2>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            style={{ 
              backgroundColor: COLORS.sageGreen, 
              color: 'white', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Plus size={20} /> {isAdding ? 'Cancelar' : 'Novo Serviço'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddService} style={{ 
            backgroundColor: 'white', padding: '20px', borderRadius: '16px', marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'grid', gap: '15px'
          }}>
            <input 
              placeholder="Nome do Serviço (ex: Corte de Cabelo)"
              value={newService.name}
              onChange={e => setNewService({...newService, name: e.target.value})}
              required
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: '#666' }}>Duração (minutos)</label>
                <input 
                  type="number"
                  value={newService.duration_minutes}
                  onChange={e => setNewService({...newService, duration_minutes: parseInt(e.target.value)})}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: '#666' }}>Preço (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  value={newService.price}
                  onChange={e => setNewService({...newService, price: parseFloat(e.target.value)})}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <button type="submit" style={{ 
              backgroundColor: COLORS.deepCharcoal, color: 'white', border: 'none', 
              padding: '12px', borderRadius: '8px', cursor: 'pointer' 
            }}>
              Guardar Serviço
            </button>
          </form>
        )}

        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {services.map(service => (
              <div key={service.id} style={{ 
                backgroundColor: 'white', padding: '15px 20px', borderRadius: '12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: COLORS.deepCharcoal }}>{service.name}</h4>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: '#666' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {service.duration_minutes} min
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <DollarSign size={14} /> R$ {service.price}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(service.id)}
                  style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '5px' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}