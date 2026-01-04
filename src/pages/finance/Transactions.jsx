import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useSalon } from '../../context/SalonContext';
import moment from 'moment';
import { DollarSign, ShoppingBag, Wrench, Filter, X, Loader2, Search, Download, Plus, TrendingUp, TrendingDown, Wallet, Receipt, Edit, Trash2 } from 'lucide-react';
import FinanceTabs from '../../components/ui/FinanceTabs';
import TransactionModal from '../../components/TransactionModal';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Papa from 'papaparse';

export default function Transactions() {
  const { salon, professionals } = useSalon();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
    type: '',
    professionalId: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

  const fetchTransactions = useCallback(async () => {
    if (!salon?.id) return;
    setLoading(true);

    try {
      // Helper para aplicar filtros
      const applyFilters = (query) => {
        if (filters.startDate) query = query.gte('created_at', moment(filters.startDate).startOf('day').toISOString());
        if (filters.endDate) query = query.lte('created_at', moment(filters.endDate).endOf('day').toISOString());
        if (filters.type) query = query.eq('type', filters.type);
        if (filters.professionalId) query = query.eq('professional_id', filters.professionalId);
        if (searchTerm.trim()) query = query.or(`description.ilike.%${searchTerm.trim()}%,client_name.ilike.%${searchTerm.trim()}%`);
        return query;
      };

      // 1. Buscar dados paginados
      let query = supabase
        .from('finance_transactions')
        .select('*, professionals(name)', { count: 'exact' })
        .eq('salon_id', salon.id)
        .order('created_at', { ascending: false });

      query = applyFilters(query);

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      setTransactions(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

      // 2. Calcular Resumo (Entradas, Saídas, Saldo) baseado nos filtros
      let summaryQuery = supabase
        .from('finance_transactions')
        .select('amount, type')
        .eq('salon_id', salon.id);
      
      summaryQuery = applyFilters(summaryQuery);

      const { data: summaryData, error: summaryError } = await summaryQuery;
      
      if (summaryError) throw summaryError;

      const newSummary = (summaryData || []).reduce((acc, curr) => {
        const val = Math.abs(curr.amount);
        const isExpense = curr.type === 'expense' || curr.amount < 0;
        
        if (isExpense) {
          acc.expense += val;
          acc.balance -= val;
        } else {
          acc.income += val;
          acc.balance += val;
        }
        return acc;
      }, { income: 0, expense: 0, balance: 0 });

      setSummary(newSummary);

    } catch (error) {
      console.error("Erro ao buscar transações:", error);
    } finally {
      setLoading(false);
    }
  }, [salon?.id, filters, searchTerm, currentPage, itemsPerPage]);

  useEffect(() => {
    // Debounce search to avoid excessive API calls while typing
    const delayDebounceFn = setTimeout(() => {
      fetchTransactions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchTransactions]); // fetchTransactions is memoized and depends on filters and searchTerm

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      type: '',
      professionalId: '',
    });
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      let query = supabase
        .from('finance_transactions')
        .select('*, professionals(name)')
        .eq('salon_id', salon.id)
        .order('created_at', { ascending: false });

      if (filters.startDate) query = query.gte('created_at', moment(filters.startDate).startOf('day').toISOString());
      if (filters.endDate) query = query.lte('created_at', moment(filters.endDate).endOf('day').toISOString());
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.professionalId) query = query.eq('professional_id', filters.professionalId);
      if (searchTerm.trim()) query = query.or(`description.ilike.%${searchTerm.trim()}%,client_name.ilike.%${searchTerm.trim()}%`);

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        alert("Não há dados para exportar.");
        return;
      }

      const dataToExport = data.map(t => ({
        'Data': moment(t.created_at).format('YYYY-MM-DD HH:mm:ss'),
        'Descrição': t.description,
        'Tipo': t.type,
        'Profissional': t.professionals?.name || 'N/A',
        'Cliente': t.client_name || 'N/A',
        'Método de Pagamento': t.payment_method,
        'Valor': t.amount.toFixed(2).replace('.', ',')
      }));

      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `transacoes-${moment().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao exportar dados.");
    }
  };

  const handleEdit = (transaction) => {
    setTransactionToEdit(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.")) return;
    try {
      const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
      if (error) throw error;
      fetchTransactions();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir transação.");
    }
  };

  const totalAmount = useMemo(() => {
    return transactions.reduce((acc, t) => {
      const value = Math.abs(t.amount);
      return acc + (t.type === 'expense' ? -value : value);
    }, 0);
  }, [transactions]);

  const getIconAndColor = (type) => {
    switch (type) {
      case 'service': return { Icon: Wrench, color: 'text-green-500' };
      case 'product': return { Icon: ShoppingBag, color: 'text-blue-500' };
      case 'expense': return { Icon: DollarSign, color: 'text-red-500' };
      case 'income': return { Icon: TrendingUp, color: 'text-green-500' };
      default: return { Icon: DollarSign, color: 'text-brand-muted' };
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-text">Histórico de Transações</h2>
            <p className="text-sm text-brand-muted">Visualize todas as movimentações financeiras.</p>
          </div>
          <button onClick={() => {
            setTransactionToEdit(null);
            setIsModalOpen(true);
          }} className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20">
            <Plus size={20} /> Nova Transação
          </button>
        </header>

        <FinanceTabs />

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-brand-card p-6 rounded-2xl border border-brand-muted/10 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100 text-green-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-muted">Entradas</p>
              <p className="text-2xl font-black text-brand-text">
                {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.income)}
              </p>
            </div>
          </div>
          <div className="bg-brand-card p-6 rounded-2xl border border-brand-muted/10 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100 text-red-600">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-muted">Saídas</p>
              <p className="text-2xl font-black text-red-500">
                {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.expense)}
              </p>
            </div>
          </div>
          <div className="bg-brand-card p-6 rounded-2xl border border-brand-muted/10 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${summary.balance >= 0 ? 'bg-brand-primary/10 text-brand-primary' : 'bg-red-100 text-red-600'}`}>
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-muted">Saldo do Período</p>
              <p className={`text-2xl font-black ${summary.balance >= 0 ? 'text-brand-primary' : 'text-red-500'}`}>
                {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.balance)}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-brand-card p-4 rounded-2xl border border-brand-muted/10 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div>
              <label className="text-xs font-semibold text-brand-muted">Data Início</label>
              <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full mt-1 p-2 bg-brand-surface border border-brand-muted/20 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-brand-muted">Data Fim</label>
              <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full mt-1 p-2 bg-brand-surface border border-brand-muted/20 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-brand-muted">Tipo</label>
              <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full mt-1 p-2 bg-brand-surface border border-brand-muted/20 rounded-lg text-sm">
                <option value="">Todos</option>
                <option value="service">Serviço</option>
                <option value="product">Produto</option>
                <option value="expense">Despesa</option>
                <option value="income">Receita Extra</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-brand-muted">Profissional</label>
              <select name="professionalId" value={filters.professionalId} onChange={handleFilterChange} className="w-full mt-1 p-2 bg-brand-surface border border-brand-muted/20 rounded-lg text-sm">
                <option value="">Todos</option>
                {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 col-span-1 md:col-span-2 lg:col-span-2">
              <button onClick={clearFilters} className="flex-1 flex items-center justify-center gap-2 p-2 bg-brand-surface rounded-lg text-brand-muted hover:bg-brand-muted/20 transition-colors">
                <X size={16} /> Limpar
              </button>
              <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 p-2 bg-brand-primary/10 text-brand-primary rounded-lg hover:bg-brand-primary/20 transition-colors">
                <Download size={16} /> Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
          <input 
            type="text"
            placeholder="Buscar por descrição ou nome do cliente..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-brand-card border border-brand-muted/20 rounded-2xl py-3 pl-12 pr-4 text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
          />
        </div>

        <div className="bg-brand-card rounded-2xl border border-brand-muted/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-brand-text">
              <thead className="text-xs text-brand-muted uppercase bg-brand-surface">
                <tr>
                  <th scope="col" className="px-6 py-3">Data</th>
                  <th scope="col" className="px-6 py-3">Descrição</th>
                  <th scope="col" className="px-6 py-3">Tipo</th>
                  <th scope="col" className="px-6 py-3">Profissional</th>
                  <th scope="col" className="px-6 py-3">Cliente</th>
                  <th scope="col" className="px-6 py-3">Pagamento</th>
                  <th scope="col" className="px-6 py-3 text-right">Valor</th>
                  <th scope="col" className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center p-8">
                      <div className="flex justify-center items-center gap-2 text-brand-muted">
                        <Loader2 className="animate-spin" size={16} />
                        <span>Buscando transações...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <EmptyState 
                        title="Nenhuma transação encontrada"
                        description="Não encontramos registros com os filtros atuais. Que tal registrar uma nova movimentação financeira?"
                        icon={Receipt}
                        actionLabel="Nova Transação"
                        onAction={() => setIsModalOpen(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  transactions.map(t => {
                    const { Icon, color } = getIconAndColor(t.type);
                    const isExpense = t.type === 'expense' || t.amount < 0;
                    return (
                      <tr key={t.id} className="bg-brand-card border-b border-brand-surface hover:bg-brand-surface/50">
                        <td className="px-6 py-4 font-medium whitespace-nowrap">
                          {moment(t.created_at).format('DD/MM/YY HH:mm')}
                        </td>
                        <td className="px-6 py-4 font-semibold">
                          {t.description}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-2 font-semibold ${color}`}>
                            <Icon size={14} /> {t.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {t.professionals?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          {t.client_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          {t.payment_method}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
                          {isExpense ? '- ' : '+ '}
                          {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(t.amount))}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(t)} className="p-2 text-brand-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors" title="Editar">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(t.id)} className="p-2 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Excluir">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-brand-surface font-bold border-t-2 border-brand-muted/20">
                  <td colSpan="6" className="px-6 py-4 text-right uppercase text-brand-muted">
                    Total (Página Atual)
                  </td>
                  <td className={`px-6 py-4 text-right text-base ${totalAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
          <div className="flex items-center gap-2 text-sm text-brand-muted">
            <span>Itens por página:</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-brand-card border border-brand-muted/20 rounded-lg px-2 py-1 outline-none focus:border-brand-primary text-brand-text"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        salonId={salon?.id} 
        onSuccess={fetchTransactions} 
        transactionToEdit={transactionToEdit}
      />
    </div>
  );
}