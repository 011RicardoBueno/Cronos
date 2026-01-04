import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, DollarSign, Calendar, FileText, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import moment from 'moment';

export default function TransactionModal({ isOpen, onClose, salonId, onSuccess, transactionToEdit }) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'income',
    description: '',
    amount: '',
    date: moment().format('YYYY-MM-DD'),
    payment_method: 'Dinheiro'
  });

  useEffect(() => {
    if (isOpen && transactionToEdit) {
      setFormData({
        type: transactionToEdit.type,
        description: transactionToEdit.description,
        amount: Math.abs(transactionToEdit.amount).toString().replace('.', ','),
        date: moment(transactionToEdit.created_at).format('YYYY-MM-DD'),
        payment_method: transactionToEdit.payment_method || 'Dinheiro'
      });
    } else if (isOpen && !transactionToEdit) {
      setFormData({
        type: 'income',
        description: '',
        amount: '',
        date: moment().format('YYYY-MM-DD'),
        payment_method: 'Dinheiro'
      });
    }
  }, [isOpen, transactionToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!salonId) return;

    try {
      setLoading(true);
      
      const payload = {
        salon_id: salonId,
        type: formData.type,
        description: formData.description,
        amount: parseFloat(formData.amount.toString().replace(',', '.')),
        payment_method: formData.payment_method,
        created_at: moment(formData.date).toISOString(),
      };

      let error;
      if (transactionToEdit) {
        const { error: updateError } = await supabase.from('finance_transactions').update(payload).eq('id', transactionToEdit.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('finance_transactions').insert({ ...payload, client_name: 'Movimentação Manual', professional_id: null });
        error = insertError;
      }

      if (error) throw error;

      toast.success(transactionToEdit ? 'Transação atualizada!' : 'Transação registrada com sucesso!');
      onSuccess();
      onClose();
      setFormData({
        type: 'income',
        description: '',
        amount: '',
        date: moment().format('YYYY-MM-DD'),
        payment_method: 'Dinheiro'
      });
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-brand-card w-full max-w-md rounded-3xl border border-brand-muted/20 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-brand-muted/10 flex justify-between items-center">
          <h3 className="text-xl font-bold text-brand-text">{transactionToEdit ? 'Editar Transação' : 'Nova Transação'}</h3>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-text transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income' })}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                formData.type === 'income' 
                  ? 'border-green-500 bg-green-500/10 text-green-500' 
                  : 'border-brand-muted/20 text-brand-muted hover:border-brand-muted/50'
              }`}
            >
              <TrendingUp size={24} />
              <span className="font-bold text-sm">Entrada</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense' })}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                formData.type === 'expense' 
                  ? 'border-red-500 bg-red-500/10 text-red-500' 
                  : 'border-brand-muted/20 text-brand-muted hover:border-brand-muted/50'
              }`}
            >
              <TrendingDown size={24} />
              <span className="font-bold text-sm">Saída</span>
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Descrição</label>
            <div className="relative">
              <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input 
                required
                placeholder={formData.type === 'income' ? "Ex: Venda de produto extra" : "Ex: Conta de Luz"}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 pl-10 outline-none focus:border-brand-primary transition-all text-brand-text"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Valor (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted font-bold text-sm">R$</span>
                <input 
                  required
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 pl-10 outline-none focus:border-brand-primary transition-all text-brand-text"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Data</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input 
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 pl-10 outline-none focus:border-brand-primary transition-all text-brand-text"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Método de Pagamento</label>
            <div className="relative">
              <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
              <select 
                value={formData.payment_method}
                onChange={e => setFormData({...formData, payment_method: e.target.value})}
                className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 pl-10 outline-none focus:border-brand-primary transition-all text-brand-text appearance-none"
              >
                <option value="Dinheiro">Dinheiro</option>
                <option value="Pix">Pix</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Transferência">Transferência</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Salvar Transação</>}
          </button>
        </form>
      </div>
    </div>
  );
}