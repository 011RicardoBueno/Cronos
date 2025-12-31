import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { COLORS } from '../../constants/dashboard';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageCircle, 
  Calendar, 
  Search, 
  Crown,
  AlertCircle,
  ArrowLeft 
} from 'lucide-react';
import moment from 'moment';

export default function Clients() {
  const { salon } = useSalon();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (salon?.id) fetchClients();
  }, [salon]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      // Selecionando dados com join da tabela services para pegar o preço
      const { data, error } = await supabase
        .from('slots')
        .select(`
          client_name, 
          client_phone, 
          start_time, 
          services (price)
        `)
        .eq('salon_id', salon.id)
        .order('start_time', { ascending: false });

      if (error) throw error;

      const clientMap = data.reduce((acc, curr) => {
        // Ignora se não tiver telefone (chave primária do nosso agrupamento)
        if (!curr.client_phone) return acc;
        
        const key = curr.client_phone;
        const servicePrice = Number(curr.services?.price || 0);

        if (!acc[key]) {
          acc[key] = {
            name: curr.client_name || "Cliente Sem Nome",
            phone: curr.client_phone,
            totalVisits: 0,
            totalSpent: 0,
            lastVisit: curr.start_time,
          };
        }
        acc[key].totalVisits += 1;
        acc[key].totalSpent += servicePrice;
        return acc;
      }, {});

      // Ordena por faturamento (LTV)
      const sortedClients = Object.values(clientMap).sort((a, b) => b.totalSpent - a.totalSpent);
      setClients(sortedClients);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const name = (c.name || "").toLowerCase();
    const phone = c.phone || "";
    const term = searchTerm.toLowerCase();
    return name.includes(term) || phone.includes(term);
  });

  const handleWhatsApp = (phone, name) => {
    if (!phone) return alert("Telefone não encontrado.");
    const cleanPhone = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá ${name.split(' ')[0]}, tudo bem? Sentimos sua falta aqui no ${salon.name}!`);
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>
            {/* CORRIGIDO: Adicionado explicitamente a cor ao ícone */}
            <ArrowLeft size={20} color={COLORS.deepCharcoal} />
          </button>
          <div>
            <h1 style={styles.title}>Meus Clientes</h1>
            <p style={styles.subtitle}>Ranking por fidelidade e faturamento</p>
          </div>
        </div>
        <div style={styles.statsCard}>
          <Users size={18} color={COLORS.sageGreen} />
          <span style={styles.statsValue}>{clients.length}</span>
        </div>
      </header>

      <div style={styles.actionBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input 
            placeholder="Buscar por nome ou telefone..." 
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={styles.center}>Carregando base de clientes...</div>
      ) : (
        <div style={styles.grid}>
          {filteredClients.map((client) => {
            const isInactive = moment().diff(moment(client.lastVisit), 'days') > 30;
            const isVIP = client.totalSpent > 500 || client.totalVisits > 5;

            return (
              <div key={client.phone} style={styles.clientCard}>
                <div style={styles.clientHeader}>
                  <div style={styles.clientInfo}>
                    <div style={styles.avatar}>
                      {(client.name || "?")[0].toUpperCase()}
                      {isVIP && <Crown size={12} style={styles.vipIcon} />}
                    </div>
                    <div>
                      <h3 style={styles.clientName}>{client.name}</h3>
                      <p style={styles.clientPhone}>{client.phone}</p>
                    </div>
                  </div>
                </div>

                <div style={styles.metricsRow}>
                  <div style={styles.metricBox}>
                    <span style={styles.metricLabel}>Total Gasto</span>
                    <span style={styles.metricValue}>
                      R$ {client.totalSpent.toFixed(2)}
                    </span>
                  </div>
                  <div style={styles.metricBox}>
                    <span style={styles.metricLabel}>Visitas</span>
                    <span style={styles.metricValue}>{client.totalVisits}</span>
                  </div>
                </div>

                <div style={styles.footerInfo}>
                  <Calendar size={12} />
                  <span>Última visita: {moment(client.lastVisit).format('DD/MM/YY')}</span>
                  {isInactive && <span style={styles.inactiveBadge}>Inativo</span>}
                </div>

                <button 
                  onClick={() => handleWhatsApp(client.phone, client.name)}
                  style={isInactive ? styles.actionBtnDanger : styles.actionBtnSuccess}
                >
                  <MessageCircle size={16} />
                  {isInactive ? 'Recuperar Cliente' : 'WhatsApp'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: COLORS.offWhite, minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  backBtn: { background: 'white', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' },
  title: { fontSize: '20px', fontWeight: 'bold', color: COLORS.deepCharcoal, margin: 0 },
  subtitle: { color: '#888', margin: 0, fontSize: '13px' },
  statsCard: { backgroundColor: 'white', padding: '10px 15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  statsValue: { fontWeight: '800', fontSize: '14px', color: COLORS.deepCharcoal },
  actionBar: { marginBottom: '20px' },
  searchWrapper: { position: 'relative' },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' },
  searchInput: { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid #EEE', boxSizing: 'border-box', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' },
  clientCard: { backgroundColor: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #F0F0F0', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
  clientHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  clientInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: COLORS.warmSand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', position: 'relative', color: COLORS.deepCharcoal },
  vipIcon: { position: 'absolute', top: -4, right: -4, color: '#D4AF37' },
  clientName: { fontSize: '14px', fontWeight: '700', margin: 0, color: COLORS.deepCharcoal },
  clientPhone: { fontSize: '12px', color: '#999', margin: 0 },
  metricsRow: { display: 'flex', gap: '10px', marginBottom: '15px' },
  metricBox: { flex: 1, backgroundColor: '#F8F9FA', padding: '10px', borderRadius: '10px', textAlign: 'center' },
  metricLabel: { display: 'block', fontSize: '10px', color: '#888', textTransform: 'uppercase', marginBottom: '2px', fontWeight: '600' },
  metricValue: { display: 'block', fontSize: '14px', fontWeight: '800', color: COLORS.deepCharcoal },
  footerInfo: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#999', marginBottom: '15px' },
  inactiveBadge: { backgroundColor: '#FFF5F5', color: '#E53E3E', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', marginLeft: 'auto' },
  actionBtnSuccess: { width: '100%', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#F0FDF4', color: '#166534', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' },
  actionBtnDanger: { width: '100%', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#FFF5F5', color: '#C53030', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' },
  center: { textAlign: 'center', padding: '50px', color: '#999' }
};