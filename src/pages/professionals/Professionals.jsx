import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/dashboard';
import BackButton from '../../components/ui/BackButton';
import { Star, Percent, Trash2, UserPlus } from 'lucide-react';

const Profissionais = () => {
  const { salon, professionals, refreshSalon, loading } = useSalon();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    commission_rate: '50'
  });

  const handleAddProfessional = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !salon?.id) {
      alert("Erro: Preencha o nome do profissional.");
      return;
    }

    try {
      setIsAdding(true);
      const { error } = await supabase
        .from('professionals')
        .insert([{ 
          name: formData.name.trim(), 
          salon_id: salon.id,
          commission_rate: parseFloat(formData.commission_rate)
        }]);

      if (error) throw error;

      setFormData({ name: '', commission_rate: '50' });
      await refreshSalon(); 
      alert('Profissional cadastrado com sucesso!');
    } catch (err) {
      alert('Erro ao cadastrar: ' + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este profissional? Os dados financeiros históricos serão mantidos, mas ele não aparecerá mais na agenda.')) return;
    try {
      const { error } = await supabase.from('professionals').delete().eq('id', id);
      if (error) throw error;
      await refreshSalon();
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  if (loading && !salon) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>;

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <BackButton colors={COLORS} />
        
        <h1 style={{ color: COLORS.deepCharcoal, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserPlus size={28} color={COLORS.sageGreen} /> Gestão da Equipe
        </h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>Defina a comissão individual e acompanhe o desempenho da equipe.</p>

        {/* Formulário de Cadastro */}
        <div style={styles.card}>
          <form onSubmit={handleAddProfessional} style={styles.formGrid}>
            <div style={{ flex: 2 }}>
              <label style={styles.label}>Nome do Profissional</label>
              <input
                type="text"
                placeholder="Ex: Carlos Barbeiro"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={isAdding}
                style={styles.input}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Comissão (%)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({...formData, commission_rate: e.target.value})}
                  disabled={isAdding}
                  style={{ ...styles.input, paddingLeft: '35px' }}
                />
                <Percent size={16} style={styles.inputIcon} />
              </div>
            </div>
            <button
              type="submit"
              disabled={isAdding || !formData.name.trim()}
              style={{ ...styles.addBtn, backgroundColor: isAdding ? '#ccc' : COLORS.sageGreen }}
            >
              {isAdding ? 'Salvando...' : 'Adicionar'}
            </button>
          </form>
        </div>

        {/* Lista de Profissionais */}
        <div style={{ display: 'grid', gap: '15px' }}>
          {professionals.length > 0 ? (
            professionals.map(prof => (
              <div key={prof.id} style={styles.profRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={styles.avatar}>
                    {prof.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span style={styles.profName}>{prof.name}</span>
                    <div style={styles.profMeta}>
                      <span style={styles.ratingBadge}>
                        <Star size={12} fill="#FFD700" color="#FFD700" /> {prof.avg_rating || '5.0'}
                      </span>
                      <span style={{ color: '#888' }}>•</span>
                      <span>Comissão: <strong>{prof.commission_rate}%</strong></span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(prof.id)}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>
              <p style={{ color: '#666', margin: 0 }}>Nenhum profissional cadastrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: { backgroundColor: 'white', padding: '24px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  formGrid: { display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' },
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '6px' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${COLORS.warmSand}`, fontSize: '16px', boxSizing: 'border-box' },
  inputIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' },
  addBtn: { color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: '0.3s', height: '47px' },
  profRow: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${COLORS.warmSand}` },
  avatar: { width: '45px', height: '45px', backgroundColor: COLORS.warmSand, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: COLORS.deepCharcoal },
  profName: { fontSize: '18px', fontWeight: '600', color: COLORS.deepCharcoal },
  profMeta: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginTop: '4px' },
  ratingBadge: { display: 'flex', alignItems: 'center', gap: '4px', color: '#B8860B', fontWeight: 'bold' },
  deleteBtn: { color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' },
  emptyState: { textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '12px', border: `1px dashed ${COLORS.warmSand}` }
};

export default Profissionais;