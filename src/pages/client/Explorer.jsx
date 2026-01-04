import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/constants/dashboard';
import { Search, MapPin, ChevronRight } from 'lucide-react';
import ClientHeader from '@/components/ui/ClientHeader';

export default function Explorer() {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const { data, error } = await supabase
          .from('salons')
          .select('*')
          .order('name');
        if (error) throw error;
        setSalons(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSalons();
  }, []);

  const filteredSalons = salons.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh' }}>
      <ClientHeader />
      
      <div style={styles.container}>
        <h2 style={styles.title}>Encontre seu salão</h2>
        
        <div style={styles.searchBox}>
          <Search size={20} color="#999" />
          <input 
            placeholder="Nome ou endereço..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {loading ? (
          <p style={styles.center}>Buscando salões...</p>
        ) : (
          <div style={styles.grid}>
            {filteredSalons.map(salon => (
              <div 
                key={salon.id} 
                onClick={() => navigate(`/agendar/${salon.id}`)}
                style={styles.card}
              >
                <div style={styles.cardInfo}>
                  <div style={styles.salonName}>{salon.name}</div>
                  <div style={styles.salonAddress}>
                    <MapPin size={14} />
                    {salon.address || 'Endereço não informado'}
                  </div>
                </div>
                <ChevronRight color={COLORS.sageGreen} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '500px', margin: '0 auto', padding: '0 20px 40px' },
  title: { fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.deepCharcoal, marginBottom: '20px' },
  searchBox: { 
    display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', 
    padding: '12px 15px', borderRadius: '14px', marginBottom: '25px', border: '1px solid #eee' 
  },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '1rem', color: '#333' },
  grid: { display: 'grid', gap: '15px' },
  card: { 
    backgroundColor: 'white', padding: '20px', borderRadius: '16px', display: 'flex', 
    justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', 
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #eee' 
  },
  salonName: { fontWeight: 'bold', fontSize: '1.1rem', color: COLORS.deepCharcoal, marginBottom: '4px' },
  salonAddress: { fontSize: '0.85rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' },
  center: { textAlign: 'center', marginTop: '40px', color: '#666' }
};