import React, { useState, useEffect } from 'react';
import { useSalon } from '../../context/SalonContext';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/dashboard';
import BackButton from '../../components/ui/BackButton';
import { Save, Building2, MapPin, Phone, Info } from 'lucide-react';

export default function Configuracoes() {
  const { salon, refreshSalon } = useSalon();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    description: ''
  });

  // Sincroniza o formulário quando os dados do salão carregam
  useEffect(() => {
    if (salon) {
      setFormData({
        name: salon.name || '',
        address: salon.address || '',
        phone: salon.phone || '',
        description: salon.description || ''
      });
    }
  }, [salon]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!salon?.id) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('salons')
        .update({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          description: formData.description,
          updated_at: new Date()
        })
        .eq('id', salon.id);

      if (error) throw error;

      await refreshSalon();
      alert('Configurações atualizadas com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <BackButton colors={COLORS} />
        
        <div style={{ margin: '20px 0' }}>
          <h2 style={{ color: COLORS.deepCharcoal, margin: 0 }}>Configurações do Salão</h2>
          <p style={{ color: '#666' }}>Gerencie as informações públicas do seu estabelecimento</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}><Building2 size={20} /> Dados Básicos</h3>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nome do Salão</label>
              <input 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Descrição / Slogan</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                placeholder="Ex: O melhor corte da região"
              />
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}><MapPin size={20} /> Localização e Contato</h3>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Endereço Completo</label>
              <input 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                style={styles.input}
                placeholder="Rua, Número, Bairro, Cidade"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Telefone / WhatsApp</label>
              <input 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                style={styles.input}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              ...styles.saveButton,
              backgroundColor: loading ? '#ccc' : COLORS.sageGreen
            }}
          >
            <Save size={20} />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    display: 'grid',
    gap: '20px'
  },
  cardTitle: {
    margin: '0 0 10px 0',
    fontSize: '1.1rem',
    color: COLORS.deepCharcoal,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: `1px solid ${COLORS.offWhite}`,
    paddingBottom: '10px'
  },
  inputGroup: {
    display: 'grid',
    gap: '8px'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#555'
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid #ddd`,
    fontSize: '1rem',
    outlineColor: COLORS.sageGreen
  },
  saveButton: {
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: '0.3s'
  }
};