import React, { useState, useEffect } from 'react';
import { useSalon } from '../../context/SalonContext';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/dashboard';
import { useNavigate } from 'react-router-dom';
import { Save, Building2, MapPin, Clock, Globe, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';

export default function Configuracoes() {
  const { salon, refreshSalon } = useSalon();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    description: '',
    opening_time: '08:00',
    closing_time: '19:00',
    slug: ''
  });

  useEffect(() => {
    if (salon) {
      setFormData({
        name: salon.name || '',
        address: salon.address || '',
        phone: salon.phone || '',
        description: salon.description || '',
        opening_time: salon.opening_time || '08:00',
        closing_time: salon.closing_time || '19:00',
        slug: salon.slug || ''
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
          opening_time: formData.opening_time,
          closing_time: formData.closing_time,
          updated_at: new Date()
        })
        .eq('id', salon.id);

      if (error) throw error;

      await refreshSalon();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Erro ao atualizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <header style={styles.pageHeader}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.deepCharcoal} />
          </button>
          <div>
            <h2 style={{ color: COLORS.deepCharcoal, margin: 0 }}>Configurações</h2>
            <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Ajuste a identidade do seu negócio</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
          
          {/* Link Público (Slug Desativado para Monetização) */}
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={styles.cardTitle}><Globe size={20} /> Link do Agendamento</h3>
               <Lock size={16} color="#999" />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Sua URL Única</label>
              <input 
                value={formData.slug}
                disabled // Campo desabilitado conforme pedido
                style={{ ...styles.input, backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' }}
              />
              <p style={styles.helperText}>
                Para alterar seu link personalizado, entre em contato com o suporte.
              </p>
            </div>
          </div>

          {/* Dados Básicos */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}><Building2 size={20} /> Perfil Profissional</h3>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nome do Estabelecimento</label>
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
              />
            </div>
          </div>

          {/* Horários e Contato */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}><Clock size={20} /> Funcionamento</h3>
              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Abertura</label>
                  <input type="time" value={formData.opening_time} onChange={e => setFormData({...formData, opening_time: e.target.value})} style={styles.input} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Fechamento</label>
                  <input type="time" value={formData.closing_time} onChange={e => setFormData({...formData, closing_time: e.target.value})} style={styles.input} />
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}><MapPin size={20} /> Contato</h3>
              <div style={styles.inputGroup}>
                <label style={styles.label}>WhatsApp / Telefone</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={styles.input} />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              ...styles.saveButton,
              backgroundColor: saved ? COLORS.sageGreen : (loading ? '#ccc' : COLORS.deepCharcoal)
            }}
          >
            {saved ? <CheckCircle2 size={20} /> : <Save size={20} />}
            {saved ? 'Alterações Salvas!' : (loading ? 'Salvando...' : 'Salvar Alterações')}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  pageHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' },
  backBtn: { background: 'white', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex' },
  card: { backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'grid', gap: '15px' },
  cardTitle: { margin: 0, fontSize: '1rem', fontWeight: 'bold', color: COLORS.deepCharcoal, display: 'flex', alignItems: 'center', gap: '10px' },
  inputGroup: { display: 'grid', gap: '6px' },
  label: { fontSize: '0.85rem', fontWeight: '700', color: '#444' }, // Texto mais escuro para visibilidade
  input: { 
    padding: '12px', 
    borderRadius: '10px', 
    border: `1px solid #ddd`, 
    fontSize: '14px', 
    backgroundColor: '#fff', 
    color: '#333', // Texto preto para visibilidade
    outline: 'none'
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  helperText: { margin: 0, fontSize: '11px', color: '#888' },
  saveButton: { padding: '16px', borderRadius: '15px', border: 'none', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s ease' }
};