import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/dashboard';
import BackButton from '../../components/ui/BackButton';

const Profissionais = () => {
  const { salon, professionals, refreshSalon, loading } = useSalon();
  const [newProfName, setNewProfName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddProfessional = async (e) => {
    e.preventDefault();
    
    // Verificação de segurança: precisa ter nome e o salão carregado no contexto
    if (!newProfName.trim() || !salon?.id) {
      alert("Erro: Dados do salão não carregados.");
      return;
    }

    try {
      setIsAdding(true);
      const { error } = await supabase
        .from('professionals')
        .insert([{ 
          name: newProfName.trim(), 
          salon_id: salon.id 
        }]);

      if (error) throw error;

      setNewProfName('');
      await refreshSalon(); 
      alert('Profissional cadastrado com sucesso!');
    } catch (err) {
      // Se o erro persistir após o SQL, aqui ele dirá o porquê
      alert('Erro ao cadastrar: ' + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este profissional? Isso pode afetar agendamentos existentes.')) return;
    try {
      const { error } = await supabase.from('professionals').delete().eq('id', id);
      if (error) throw error;
      await refreshSalon();
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  if (loading && !salon) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando dados do salão...</div>;

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <BackButton colors={COLORS} />
        
        <h1 style={{ color: COLORS.deepCharcoal, marginBottom: '30px' }}>Gestão de Profissionais</h1>

        {/* Formulário de Cadastro */}
        <div style={{ backgroundColor: COLORS.white, padding: '24px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleAddProfessional} style={{ display: 'flex', gap: '15px' }}>
            <input
              type="text"
              placeholder="Nome do Profissional (ex: João Barbeiro)"
              value={newProfName}
              onChange={(e) => setNewProfName(e.target.value)}
              disabled={isAdding}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${COLORS.warmSand}`,
                fontSize: '16px',
                outlineColor: COLORS.sageGreen
              }}
            />
            <button
              type="submit"
              disabled={isAdding || !newProfName.trim()}
              style={{
                backgroundColor: isAdding ? '#ccc' : COLORS.sageGreen,
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: isAdding ? 'not-allowed' : 'pointer',
                transition: '0.3s'
              }}
            >
              {isAdding ? 'Salvando...' : 'Adicionar'}
            </button>
          </form>
        </div>

        {/* Lista de Profissionais */}
        <div style={{ display: 'grid', gap: '15px' }}>
          {professionals.length > 0 ? (
            professionals.map(prof => (
              <div key={prof.id} style={{
                backgroundColor: COLORS.white,
                padding: '20px',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: `1px solid ${COLORS.warmSand}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: COLORS.warmSand, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: COLORS.deepCharcoal }}>
                    {prof.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: '500', color: COLORS.deepCharcoal }}>{prof.name}</span>
                </div>
                <button 
                  onClick={() => handleDelete(prof.id)}
                  style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                >
                  Excluir
                </button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '12px', border: `1px dashed ${COLORS.warmSand}` }}>
              <p style={{ color: '#666', margin: 0 }}>Nenhum profissional cadastrado ainda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profissionais;