import React, { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag, DollarSign, User, CheckCircle, MessageSquare, Loader2 } from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { supabase } from '../lib/supabase';

const CheckoutModal = ({ isOpen, onClose, slot, onComplete }) => {
  const { professionals } = useSalon();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Pix'); // Default payment method

  const fetchProducts = async (salonId) => {
    const { data } = await supabase.from('products').select('*').eq('salon_id', salonId);
    return data;
  };

  const loadProducts = React.useCallback(async () => {
    if (!slot?.salon_id) return;
    const data = await fetchProducts(slot.salon_id);
    setAllProducts(data || []);
  }, [slot?.salon_id]);



  useEffect(() => {
    if (isOpen && slot) {
      loadProducts();
      setShowSuccess(false);
      setSelectedProducts([]);
      setAdvanceAmount(0);
      setPaymentMethod('Pix'); // Reset on open
    }
  }, [isOpen, slot, loadProducts]);

  const addProduct = (prod) => {
    setSelectedProducts([...selectedProducts, { 
      ...prod, 
      type: 'product',
      seller_id: slot?.professional_id 
    }]);
  };

  // --- TRAVA DE SEGURANÇA CONTRA CRASH ---
  // Se o modal não estiver aberto ou não houver slot, não renderiza e não calcula nada.
  if (!isOpen || !slot || !slot.services) return null;

  // Cálculos de Totalizadores (Executados apenas se o slot existir)
  const servicePrice = slot.services?.price || 0;
  const totalProducts = selectedProducts.reduce((acc, p) => acc + (p.price || 0), 0);
  const totalItems = servicePrice + totalProducts;
  const numericAdvance = Math.max(0, parseFloat(advanceAmount || 0)); 
  const finalTotal = Math.max(0, totalItems - numericAdvance);

  const handleFinish = async () => {
    if (numericAdvance > totalItems) {
      return alert("O valor do abatimento não pode ser maior que o total da venda.");
    }

    const processSale = async ({ salonId, slotId, items, advanceAmount, paymentMethod }) => {
      // 1. Update slot status to 'completed'
      const { data: slotData, error: slotError } = await supabase
        .from('slots')
        .update({ status: 'completed' })
        .eq('id', slotId)
        .select('professional_id, client_name, client_phone')
        .single();
    
      if (slotError) throw slotError;
    
      // 2. Prepare financial transaction records
      const transactions = items.map(item => ({
        salon_id: salonId,
        slot_id: slotId,
        professional_id: item.professional_id,
        client_name: slotData.client_name,
        client_phone: slotData.client_phone,
        type: item.type,
        description: item.description,
        amount: item.price,
        payment_method: paymentMethod,
        professional_commission: item.price * (item.commission_rate / 100)
      }));
    
      if (advanceAmount > 0) {
        transactions.push({
          salon_id: salonId,
          slot_id: slotId,
          professional_id: slotData.professional_id,
          client_name: slotData.client_name,
          client_phone: slotData.client_phone,
          type: 'advance_redemption',
          description: 'Uso de adiantamento/vale',
          amount: -advanceAmount,
          payment_method: 'N/A',
          professional_commission: 0
        });
      }
    
      const { error: transError } = await supabase.from('finance_transactions').insert(transactions);
      if (transError) throw transError;
    
      // 3. Update product stock for sold items
      const productUpdates = items
        .filter(item => item.type === 'product')
        .map(product => 
          supabase.rpc('decrement_stock', { 
            product_id: product.id, 
            quantity: 1 
          })
        );

      const productResults = await Promise.all(productUpdates);
      const productError = productResults.find(res => res.error);
      if (productError) throw productError.error;
    };

    setLoading(true);
    try {
      const items = [
        {
          id: slot.service_id,
          name: slot.services.name,
          price: slot.services.price,
          commission_rate: slot.professionals?.commission_rate || 0,
          professional_id: slot.professional_id,
          type: 'service',
          description: `Serviço: ${slot.services.name}`
        },
        ...selectedProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          commission_rate: professionals.find(pro => pro.id === p.seller_id)?.commission_rate || 0,
          professional_id: p.seller_id,
          type: 'product',
          description: `Produto: ${p.name}`
        }))
      ];

      await processSale({
        salonId: slot.salon_id,
        slotId: slot.id,
        items,
        advanceAmount: numericAdvance,
        paymentMethod: paymentMethod
      });

      if (onComplete) onComplete();
      setShowSuccess(true);
    } catch (error) {
      console.error("Erro no checkout:", error);
      alert('Erro ao finalizar venda: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- TELA DE SUCESSO ---
  if (showSuccess) {
    const phone = slot.client_phone ? slot.client_phone.replace(/\D/g, '') : '';
    const comandaTexto = `*RESUMO DO ATENDIMENTO - ${slot.salon_name || 'Salão'}*\n\n` +
      `Olá ${slot.client_name}! Aqui está o seu resumo:\n` +
      `--------------------------\n` +
      `*Serviço:* ${slot.services.name} (R$ ${slot.services.price.toFixed(2)})\n` +
      (selectedProducts.length > 0 ? `*Produtos:* ${selectedProducts.map(p => p.name).join(', ')}\n` : '') +
      `*Total Pago:* R$ ${finalTotal.toFixed(2)}\n` +
      `--------------------------\n` +
      `Obrigado pela preferência!`;

    const whatsappUrl = phone 
      ? `https://wa.me/55${phone}?text=${encodeURIComponent(comandaTexto)}`
      : null;

    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-brand-card w-full max-w-md rounded-3xl p-8 text-center animate-in fade-in zoom-in-95">
          <CheckCircle size={60} className="text-brand-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-brand-text mb-2">Venda Concluída!</h2>
          <p className="text-brand-muted mb-8">Financeiro atualizado e estoque baixado.</p>
          <div className="flex flex-col gap-3">
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 p-4 rounded-xl bg-green-500 text-white font-bold no-underline">
                <MessageSquare size={18} /> Enviar Comanda via WhatsApp
              </a>
            )}
            <button onClick={onClose} className="p-4 rounded-xl bg-brand-surface text-brand-muted font-bold">Fechar e Voltar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-brand-card w-full max-w-lg rounded-3xl shadow-2xl border border-brand-muted/20 animate-in fade-in-90">
        <div className="p-6 border-b border-brand-muted/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-brand-text">Finalizar Atendimento</h2>
            <span className="text-sm text-brand-muted">Cliente: {slot.client_name}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-brand-surface rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-brand-surface p-4 rounded-2xl flex justify-between items-center border border-brand-muted/10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
                <User size={20} />
              </div>
              <div>
                <strong className="block font-bold text-brand-text">{slot.services.name}</strong>
                <span className="text-xs text-brand-muted">Profissional: {slot.professionals?.name}</span>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-sm font-bold">R$ {servicePrice.toFixed(2)}</span>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-brand-text mb-2"><ShoppingBag size={16} /> Adicionar Produtos</label>
            <select 
              className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 text-sm outline-none focus:border-brand-primary transition-all mb-3"
              onChange={(e) => {
                const prod = allProducts.find(p => p.id === e.target.value);
                if (prod) addProduct(prod);
                e.target.value = "";
              }} 
              value=""
            >
              <option value="" disabled>Buscar no estoque...</option>
              {allProducts.map(p => (
                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                  {p.name} (Estoque: {p.stock}) - R$ {p.price.toFixed(2)}
                </option>
              ))}
            </select>

            <div className="space-y-2">
              {selectedProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-brand-surface rounded-xl border border-brand-muted/10">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-brand-text">{p.name}</div>
                    <select 
                      className="text-xs bg-transparent border-none p-0 text-blue-500 font-semibold cursor-pointer focus:ring-0"
                      value={p.seller_id}
                      onChange={(e) => {
                        const newItems = [...selectedProducts];
                        newItems[i].seller_id = e.target.value;
                        setSelectedProducts(newItems);
                      }}
                    >
                      {professionals.map(pro => <option key={pro.id} value={pro.id}>Vendedor: {pro.name}</option>)}
                    </select>
                  </div>
                  <strong className="text-sm">R$ {p.price.toFixed(2)}</strong>
                  <button onClick={() => setSelectedProducts(selectedProducts.filter((_, idx) => idx !== i))} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
            <label className="flex items-center gap-2 text-sm font-bold text-amber-700 mb-2"><DollarSign size={16} /> Abater Vale ou Antecipação</label>
            <input 
              type="number" 
              min="0"
              className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 text-lg font-bold outline-none focus:border-brand-primary transition-all"
              value={advanceAmount} 
              onChange={(e) => setAdvanceAmount(e.target.value)} 
              placeholder="R$ 0,00"
            />
          </div>
        </div>

        <div className="p-6 border-t border-brand-muted/10">
          <label className="text-xs font-bold text-brand-muted uppercase mb-2 block">Forma de Pagamento</label>
          <select 
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full bg-brand-surface border border-brand-muted/20 rounded-xl p-3 text-sm font-semibold outline-none focus:border-brand-primary transition-all"
          >
            <option value="Pix">Pix</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Cartão de Débito">Cartão de Débito</option>
            <option value="Dinheiro">Dinheiro</option>
          </select>
        </div>

        <div className="p-6 border-t border-brand-muted/10 bg-brand-card rounded-b-3xl">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-brand-muted">Total a Receber</span>
              <h3 className="text-3xl font-black text-brand-text">R$ {finalTotal.toFixed(2)}</h3>
            </div>
            <button 
              onClick={handleFinish} 
              disabled={loading} 
              className="px-8 py-4 rounded-xl font-bold bg-brand-primary text-white hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2 disabled:bg-brand-muted"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Finalizar Venda'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;