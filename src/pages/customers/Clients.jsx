import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, MessageCircle, Calendar, Search, 
  Crown, ArrowLeft, X, ShoppingBag, CheckCircle, Clock, Loader2
} from 'lucide-react';
import moment from 'moment';

export default function Clients() {
  const { salon } = useSalon();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 8;
  // Estados para o Histórico Detalhado
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientHistory, setClientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!salon?.id) return;

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

    fetchClients();
  }, [salon?.id]);

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

  // --- Pagination Logic ---
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  const handleWhatsApp = (e, phone, name) => {
    e.stopPropagation(); // Evita abrir o modal ao clicar no botão de Whats
    if (!phone) return alert("Telefone não encontrado.");
    const cleanPhone = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá ${name.split(' ')[0]}, tudo bem? Sentimos sua falta aqui no ${salon.name}!`);
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-brand-surface p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-text">Base de Clientes</h1>
            <p className="text-sm text-brand-muted">Gestão de fidelidade e faturamento real</p>
          </div>
          <div className="bg-brand-card border border-brand-muted/20 px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2">
            <Users size={18} className="text-brand-primary" />
            <span className="font-bold text-brand-text">{clients.length} Clientes</span>
          </div>
        </header>

        {/* BUSCA */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nome ou telefone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-card border border-brand-muted/20 rounded-2xl py-3 pl-12 pr-4 text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
          />
        </div>

        {/* GRID DE CLIENTES */}
        {loading ? (
          <div className="text-center p-10 text-brand-muted animate-pulse">Carregando clientes...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentClients.map((client) => {
              const daysSinceLastVisit = moment().diff(moment(client.lastVisit), 'days');
              const isInactive = daysSinceLastVisit > 30;
              const isVIP = client.totalSpent > 500 || client.totalVisits > 5;

              return (
                <div 
                  key={client.phone} 
                  onClick={() => handleOpenHistory(client)}
                  className="bg-brand-card rounded-3xl border border-brand-muted/20 p-6 hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg relative ${
                      isVIP ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-400/30' : 'bg-brand-surface text-brand-muted'
                    }`}>
                      {(client.name || "?")[0].toUpperCase()}
                      {isVIP && <Crown size={14} className="absolute -top-1 -right-1 text-amber-500 fill-amber-500" />}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="text-brand-text font-bold text-base truncate">{client.name}</h3>
                      <p className="text-brand-muted text-xs">{client.phone}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mb-6">
                    <div className="flex-1 bg-brand-surface rounded-xl p-3 text-center">
                      <span className="block text-[10px] font-bold text-brand-muted uppercase">Total Gasto</span>
                      <span className="block text-sm font-black text-brand-primary">R$ {client.totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="flex-1 bg-brand-surface rounded-xl p-3 text-center">
                      <span className="block text-[10px] font-bold text-brand-muted uppercase">Visitas</span>
                      <span className="block text-sm font-black text-brand-text">{client.totalVisits}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-brand-muted mb-4 font-medium">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{moment(client.lastVisit).format('DD/MM/YY')}</span>
                    </div>
                    {isInactive && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-md">Ausente</span>}
                  </div>

                  <button 
                    onClick={(e) => handleWhatsApp(e, client.phone, client.name)}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                      isInactive 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20'
                    }`}
                  >
                    <MessageCircle size={16} />
                    {isInactive ? 'Recuperar' : 'WhatsApp'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-10">
            <button 
              onClick={() => paginate(currentPage - 1)} 
              disabled={currentPage === 1}
              className="px-4 py-2 bg-brand-card border border-brand-muted/20 rounded-lg font-semibold text-brand-text disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-brand-muted font-medium text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <button 
              onClick={() => paginate(currentPage + 1)} 
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-brand-card border border-brand-muted/20 rounded-lg font-semibold text-brand-text disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {/* MODAL DE HISTÓRICO */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-brand-card w-full max-w-2xl rounded-3xl shadow-2xl border border-brand-muted/20 max-h-[85vh] flex flex-col">
            
            <div className="p-6 border-b border-brand-muted/10 flex justify-between items-center bg-brand-card rounded-t-3xl">
              <div>
                <h3 className="text-xl font-bold text-brand-text">{selectedClient.name}</h3>
                <p className="text-sm text-brand-muted">{selectedClient.phone}</p>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-brand-surface rounded-full transition-colors text-brand-muted"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto">
              <h4 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-6">Histórico de Atividades</h4>
              {loadingHistory ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-primary" /></div>
              ) : (
                <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-brand-muted/10">
                  {clientHistory.map((visit, idx) => (
                    <div key={idx} className="relative pl-8">
                      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-brand-primary border-4 border-brand-card shadow-sm z-10" />
                      
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-brand-text text-sm">{moment(visit.start_time).format('DD [de] MMMM, YYYY')}</span>
                        <span className="text-xs text-brand-muted flex items-center gap-1"><Clock size={10} /> {moment(visit.start_time).format('HH:mm')}</span>
                      </div>
                      
                      <p className="text-sm text-brand-text mb-2">
                        <span className="font-medium">{visit.services?.name}</span> <span className="text-brand-muted">com</span> {visit.professionals?.name}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {visit.finance_transactions?.map((t, tid) => (
                          <span key={tid} className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 ${
                            t.type === 'product' ? 'bg-blue-100 text-blue-600' : 'bg-brand-primary/10 text-brand-primary'
                          }`}>
                            {t.type === 'product' ? <ShoppingBag size={10}/> : <CheckCircle size={10}/>}
                            R$ {Number(t.amount).toFixed(2)} ({t.payment_method})
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}