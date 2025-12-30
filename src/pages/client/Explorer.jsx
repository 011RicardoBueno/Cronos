import React, { useState, useEffect } from 'react';
import { COLORS } from '../../constants/dashboard';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const Explorer = () => {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      // Buscamos os salões cadastrados no banco
      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSalons(data || []);
    } catch (err) {
      console.error('Erro ao buscar salões:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtro simples por nome ou endereço
  const filteredSalons = salons.filter(salon => 
    salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salon.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = async () => {
  await supabase.auth.signOut();
  window.location.href = "/";
};

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: COLORS.offWhite,
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
  <button 
    onClick={handleLogout}
    style={{
      background: 'none',
      border: 'none',
      color: COLORS.deepCharcoal,
      cursor: 'pointer',
      fontSize: '14px',
      textDecoration: 'underline'
    }}
  >
    Sair da conta
  </button>
</div>
        
        {/* Header da Exploração */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ color: COLORS.deepCharcoal, fontSize: '32px', fontWeight: '700', marginBottom: '10px' }}>
            Encontre seu Salão
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Descubra os melhores profissionais perto de você.
          </p>
        </div>

        {/* Barra de Busca */}
        <div style={{ marginBottom: '32px' }}>
          <input
            type="text"
            placeholder="Buscar por nome ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: '12px',
              border: `1px solid ${COLORS.dustyRose}`,
              fontSize: '16px',
              backgroundColor: COLORS.white,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Listagem */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Carregando salões...</p>
        ) : filteredSalons.length > 0 ? (
          <div style={{ display: 'grid', gap: '20px' }}>
            {filteredSalons.map((salon) => (
              <div 
                key={salon.id}
                onClick={() => navigate(`/agendar/${salon.id}`)}
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  border: `1px solid transparent`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = COLORS.sageGreen;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div>
                  <h3 style={{ color: COLORS.deepCharcoal, fontSize: '20px', marginBottom: '8px' }}>
                    {salon.name}
                  </h3>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>
                    📍 {salon.address || 'Endereço não informado'}
                  </p>
                  <p style={{ color: COLORS.sageGreen, fontSize: '14px', fontWeight: '600' }}>
                    📞 {salon.phone || 'Ver telefone'}
                  </p>
                </div>
                
                <div style={{
                  backgroundColor: COLORS.warmSand,
                  color: COLORS.deepCharcoal,
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Agendar
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Nenhum salão encontrado com esse nome.
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;