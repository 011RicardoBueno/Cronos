import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { COLORS } from '../../constants/dashboard';
import BackButton from '../../components/ui/BackButton';
import { Trash2, Plus, Clock, DollarSign, X } from 'lucide-react';

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
          price: Number(newService.price),
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
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <BackButton colors={COLORS} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
          <div>
            <h2 style={{ color: COLORS.deepCharcoal, margin: 0 }}>Gestão de Serviços</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
              {salon?.name}
            </p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            style={{ 
              backgroundColor: isAdding ? '#f44336' : COLORS.sageGreen, 
              color: 'white', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              cursor: 'pointer',
              transition: '0.3s',
              fontWeight: '600'
            }}
          >
            {isAdding ? <X size={20} /> : <Plus size={20} />}
            {isAdding ? 'Cancelar' : 'Novo Serviço'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddService} style={{ 
            backgroundColor: 'white', padding: '24px', borderRadius: '16px', marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'grid', gap: '15px'
          }}>
            <div style={{ display: 'grid', gap: '5px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: COLORS.deepCharcoal }}>Nome do Serviço</label>
              <input 
                placeholder="Ex: Corte Degradê + Barba"
                value={newService.name}
                onChange={e => setNewService({...newService, name: e.target.value})}
                required
                disabled={saving}
                style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${COLORS.warmSand}`, outlineColor: COLORS.sageGreen }}
              />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1, display: 'grid', gap: '5px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: COLORS.deepCharcoal }}>Duração (minutos)</label>
                <div style={{ position: 'relative' }}>
                  <Clock size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#999' }} />
                  <input 
                    type="number"
                    min="1"
                    value={newService.duration_minutes}
                    onChange={e => setNewService({...newService, duration_minutes: e.target.value})}
                    disabled={saving}
                    style={{ width: '100%', padding: '12px 12px 12px 35px', borderRadius: '8px', border: `1px solid ${COLORS.warmSand}`, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ flex: 1, display: 'grid', gap: '5px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: COLORS.deepCharcoal }}>Preço (R$)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#999', fontWeight: '600' }}>R$</span>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={newService.price}
                    onChange={e => setNewService({...newService, price: e.target.value})}
                    disabled={saving}
                    style={{ width: '100%', padding: '12px 12px 12px 35px', borderRadius: '8px', border: `1px solid ${COLORS.warmSand}`, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              style={{ 
                backgroundColor: COLORS.deepCharcoal, 
                color: 'white', 
                border: 'none', 
                padding: '14px', 
                borderRadius: '8px', 
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                marginTop: '10px',
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? 'Guardando...' : 'Confirmar Cadastro'}
            </button>
          </form>
        )}

        {(loadingContext && services.length === 0) ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Carregando serviços...</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {services.map(service => (
              <div key={service.id} style={{ 
                backgroundColor: 'white', padding: '18px 24px', borderRadius: '12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                border: `1px solid #f0f0f0`
              }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: COLORS.deepCharcoal, fontSize: '1.1rem' }}>{service.name}</h4>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', color: '#666' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={16} color={COLORS.sageGreen} /> {service.duration_minutes} min
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: COLORS.deepCharcoal }}>
                      <DollarSign size={16} color={COLORS.sageGreen} /> R$ {Number(service.price).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(service.id)}
                  style={{ 
                    background: '#fff5f5', 
                    border: 'none', 
                    color: '#ff4d4d', 
                    cursor: 'pointer', 
                    padding: '10px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: '0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#ffebeb'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#fff5f5'}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {services.length === 0 && !isAdding && (
              <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '16px', border: `2px dashed ${COLORS.warmSand}` }}>
                <p style={{ color: '#999', margin: 0 }}>Você ainda não cadastrou nenhum serviço.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}