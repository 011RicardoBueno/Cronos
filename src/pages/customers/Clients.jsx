import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { COLORS } from '../../constants/dashboard';
import { useNavigate } from 'react-router-dom';
import { 
  Users, MessageCircle, Calendar, Search, 
  Crown, ArrowLeft, X, ShoppingBag, CheckCircle, Clock
} from 'lucide-react';
import moment from 'moment';

export default function Clients() {
  const { salon } = useSalon();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para o Histórico Detalhado
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientHistory, setClientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (salon?.id) fetchClients();
  }, [salon]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('slots')
        .select(`
          client_name, 
          client_phone, 
          start_time, 
          finance_transactions (amount, type)
        `)
        .eq('salon_id', salon.id)
        .order('start_time', { ascending: false });

      if (error) throw error;

      const clientMap = data.reduce((acc, curr) => {
        if (!curr.client_phone) return acc;
        const key = curr.client_phone;
        const amountPaid = curr.finance_transactions?.reduce((sum, trans) => {
          return trans.type !== 'advance' ? sum + Number(trans.amount) : sum;
        }, 0) || 0;

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
        acc[key].totalSpent += amountPaid;
        return acc;
      }, {});

      const sortedClients = Object.values(clientMap).sort((a, b) => b.totalSpent - a.totalSpent);
      setClients(sortedClients);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar o histórico quando clicar no card
  const handleOpenHistory = async (client) => {
    setSelectedClient(client);
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('slots')
        .select(`
          id,
          start_time,
          services (name),
          professionals (name),
          finance_transactions (amount, type, payment_method)
        `)
        .eq('client_phone', client.phone)
        .eq('salon_id', salon.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setClientHistory(data);
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const name = (c.name || "").toLowerCase();
    const phone = c.phone || "";
    return name.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
  });

  const handleWhatsApp = (e, phone, name) => {
    e.stopPropagation(); // Evita abrir o modal ao clicar no botão de Whats
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
            <ArrowLeft size={20} color={COLORS.deepCharcoal} />
          </button>
          <div>
            <h1 style={styles.title}>Base de Clientes</h1>
            <p style={styles.subtitle}>Gestão de fidelidade e faturamento real</p>
          </div>
        </div>
        <div style={styles.statsCard}>
          <div style={styles.statItem}>
            <Users size={16} color={COLORS.sageGreen} />
            <span style={styles.statsValue}>{clients.length} Clientes</span>
          </div>
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
        <div style={styles.center}><p>Carregando clientes...</p></div>
      ) : (
        <div style={styles.grid}>
          {filteredClients.map((client) => {
            const daysSinceLastVisit = moment().diff(moment(client.lastVisit), 'days');
            const isInactive = daysSinceLastVisit > 30;
            const isVIP = client.totalSpent > 500 || client.totalVisits > 5;

            return (
              <div 
                key={client.phone} 
                style={styles.clientCard} 
                onClick={() => handleOpenHistory(client)}
              >
                <div style={styles.clientHeader}>
                  <div style={styles.clientInfo}>
                    <div style={{
                      ...styles.avatar,
                      backgroundColor: isVIP ? '#FFF9E6' : COLORS.warmSand,
                      border: isVIP ? '1px solid #FFD700' : 'none'
                    }}>
                      {(client.name || "?")[0].toUpperCase()}
                      {isVIP && <Crown size={14} style={styles.vipIcon} />}
                    </div>
                    <div>
                      <h3 style={styles.clientName}>{client.name}</h3>
                      <p style={styles.clientPhone}>{client.phone}</p>
                    </div>
                  </div>
                  {isVIP && <span style={styles.vipBadge}>VIP</span>}
                </div>

                <div style={styles.metricsRow}>
                  <div style={styles.metricBox}>
                    <span style={styles.metricLabel}>Total Gasto</span>
                    <span style={{...styles.metricValue, color: COLORS.sageGreen}}>
                      R$ {client.totalSpent.toFixed(2)}
                    </span>
                  </div>
                  <div style={styles.metricBox}>
                    <span style={styles.metricLabel}>Visitas</span>
                    <span style={styles.metricValue}>{client.totalVisits}</span>
                  </div>
                </div>

                <div style={styles.footerInfo}>
                  <Calendar size={12} color="#999" />
                  <span>Última: {moment(client.lastVisit).format('DD/MM/YY')}</span>
                  {isInactive && <div style={styles.inactiveBadge}>{daysSinceLastVisit}d ausente</div>}
                </div>

                <button 
                  onClick={(e) => handleWhatsApp(e, client.phone, client.name)}
                  style={isInactive ? styles.actionBtnDanger : styles.actionBtnSuccess}
                >
                  <MessageCircle size={16} />
                  {isInactive ? 'Recuperar' : 'WhatsApp'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE HISTÓRICO (DRAWER) */}
      {selectedClient && (
        <div style={styles.modalOverlay} onClick={() => setSelectedClient(null)}>
          <div style={styles.drawer} onClick={e => e.stopPropagation()}>
            <header style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>{selectedClient.name}</h2>
                <p style={styles.modalSubtitle}>{selectedClient.phone}</p>
              </div>
              <button onClick={() => setSelectedClient(null)} style={styles.closeBtn}><X /></button>
            </header>

            <div style={styles.modalBody}>
              <h4 style={styles.sectionTitle}>Linha do Tempo</h4>
              {loadingHistory ? (
                <p>Carregando histórico...</p>
              ) : (
                clientHistory.map((visit, idx) => (
                  <div key={idx} style={styles.historyItem}>
                    <div style={styles.historyDot} />
                    <div style={styles.historyContent}>
                      <div style={styles.historyTop}>
                        <span style={styles.historyDate}>
                          {moment(visit.start_time).format('DD [de] MMMM, YYYY')}
                        </span>
                        <span style={styles.historyTime}>
                          <Clock size={10} /> {moment(visit.start_time).format('HH:mm')}
                        </span>
                      </div>
                      <p style={styles.historyService}>
                        <strong>{visit.services?.name}</strong> com {visit.professionals?.name}
                      </p>
                      <div style={styles.historyTags}>
                        {visit.finance_transactions?.map((t, tid) => (
                          <span key={tid} style={t.type === 'product' ? styles.tagProduct : styles.tagService}>
                            {t.type === 'product' ? <ShoppingBag size={10}/> : <CheckCircle size={10}/>}
                            R$ {Number(t.amount).toFixed(2)} ({t.payment_method})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '24px', maxWidth: '1200px', margin: '0 auto', backgroundColor: COLORS.offWhite, minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: { background: 'white', border: 'none', padding: '12px', borderRadius: '14px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' },
  title: { fontSize: '24px', fontWeight: '800', color: COLORS.deepCharcoal, margin: 0 },
  subtitle: { color: '#777', margin: '4px 0 0 0', fontSize: '14px' },
  statsCard: { backgroundColor: 'white', padding: '12px 20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  statItem: { display: 'flex', alignItems: 'center', gap: '10px' },
  statsValue: { fontWeight: '700', fontSize: '15px', color: COLORS.deepCharcoal },
  actionBar: { marginBottom: '24px' },
  searchWrapper: { position: 'relative' },
  searchIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#AAA' },
  searchInput: { width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '1px solid #E2E8F0', boxSizing: 'border-box', fontSize: '15px', outline: 'none' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  clientCard: { backgroundColor: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #EDF2F7', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' },
  clientHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  clientInfo: { display: 'flex', alignItems: 'center', gap: '14px' },
  avatar: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', position: 'relative', color: COLORS.deepCharcoal, fontSize: '18px' },
  vipIcon: { position: 'absolute', top: -6, right: -6, color: '#FFD700', fill: '#FFD700' },
  vipBadge: { backgroundColor: '#FFF9E6', color: '#B7791F', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' },
  clientName: { fontSize: '16px', fontWeight: '700', margin: 0 },
  clientPhone: { fontSize: '13px', color: '#888', margin: '2px 0 0 0' },
  metricsRow: { display: 'flex', gap: '12px', marginBottom: '20px' },
  metricBox: { flex: 1, backgroundColor: '#F7FAFC', padding: '12px', borderRadius: '12px', textAlign: 'center' },
  metricLabel: { display: 'block', fontSize: '10px', color: '#A0AEC0', textTransform: 'uppercase', fontWeight: '700' },
  metricValue: { display: 'block', fontSize: '15px', fontWeight: '800' },
  footerInfo: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#718096', marginBottom: '20px' },
  inactiveBadge: { backgroundColor: '#FFF5F5', color: '#C53030', padding: '3px 8px', borderRadius: '6px', fontWeight: '700', marginLeft: 'auto' },
  actionBtnSuccess: { width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#F0FDF4', color: '#166534', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' },
  actionBtnDanger: { width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#FFF5F5', color: '#C53030', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' },
  center: { textAlign: 'center', padding: '80px', color: '#718096' },

  // ESTILOS DO MODAL / DRAWER
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' },
  drawer: { width: '100%', maxWidth: '450px', backgroundColor: 'white', height: '100%', padding: '32px', boxShadow: '-5px 0 25px rgba(0,0,0,0.1)', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
  modalTitle: { fontSize: '20px', fontWeight: '800', margin: 0 },
  modalSubtitle: { fontSize: '14px', color: '#888', margin: '4px 0 0 0' },
  closeBtn: { background: '#F7FAFC', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer' },
  sectionTitle: { fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: '#A0AEC0', marginBottom: '20px', letterSpacing: '1px' },
  historyItem: { position: 'relative', paddingLeft: '24px', paddingBottom: '32px', borderLeft: '2px solid #EDF2F7' },
  historyDot: { position: 'absolute', left: '-7px', top: '0', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS.sageGreen, border: '2px solid white' },
  historyTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  historyDate: { fontSize: '13px', fontWeight: '700', color: COLORS.deepCharcoal },
  historyTime: { fontSize: '11px', color: '#A0AEC0', display: 'flex', alignItems: 'center', gap: '4px' },
  historyService: { fontSize: '14px', color: '#4A5568', margin: '0 0 12px 0' },
  historyTags: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  tagService: { backgroundColor: '#F0FDF4', color: '#166534', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' },
  tagProduct: { backgroundColor: '#EFF6FF', color: '#1E40AF', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }
};