import React, { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag, DollarSign, User, CheckCircle, MessageSquare } from 'lucide-react';
import { COLORS } from '../constants/dashboard';
import { useSalon } from '../context/SalonContext';
import { fetchProducts, processSale } from '../services/supabaseService';

const CheckoutModal = ({ isOpen, onClose, slot, onComplete }) => {
  const { professionals } = useSalon();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [advanceAmount, setAdvanceAmount] = useState(0);

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
        paymentMethod: 'Presencial'
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
      <div style={styles.overlay}>
        <div style={{...styles.modal, textAlign: 'center', padding: '40px 24px'}}>
          <CheckCircle size={60} color={COLORS.sageGreen} style={{ marginBottom: '15px' }} />
          <h2 style={{ color: COLORS.deepCharcoal, margin: '0 0 10px 0' }}>Venda Concluída!</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>Financeiro atualizado e estoque baixado.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer" style={styles.whatsappBtn}>
                <MessageSquare size={18} /> Enviar Comanda via WhatsApp
              </a>
            )}
            <button onClick={onClose} style={styles.secondaryBtn}>Fechar e Voltar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Finalizar Atendimento</h2>
            <span style={{fontSize: '12px', color: '#888'}}>Cliente: {slot.client_name}</span>
          </div>
          <button onClick={onClose} style={styles.closeBtn}><X /></button>
        </div>

        <div style={styles.content}>
          <div style={styles.infoCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={styles.avatarPlaceholder}>{slot.client_name?.charAt(0).toUpperCase()}</div>
              <div>
                <strong style={{display: 'block', fontSize: '15px'}}>{slot.services.name}</strong>
                <span style={{ fontSize: '12px', color: '#666' }}>Profissional: {slot.professionals?.name}</span>
              </div>
            </div>
            <span style={styles.serviceBadge}>R$ {servicePrice.toFixed(2)}</span>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label style={styles.label}><ShoppingBag size={16} /> Adicionar Produtos</label>
            <select 
              style={styles.select} 
              onChange={(e) => {
                const prod = allProducts.find(p => p.id === e.target.value);
                if (prod) addProduct(prod);
                e.target.value = "";
              }} 
              value=""
            >
              <option value="">Buscar no estoque...</option>
              {allProducts.map(p => (
                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                  {p.name} - R$ {p.price.toFixed(2)}
                </option>
              ))}
            </select>

            {selectedProducts.map((p, i) => (
              <div key={i} style={styles.itemRow}>
                <div style={{flex: 1}}>
                  <div style={{fontSize: '14px', fontWeight: 'bold'}}>{p.name}</div>
                  <select 
                    style={styles.miniSelect}
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
                <strong>R$ {p.price.toFixed(2)}</strong>
                <button onClick={() => setSelectedProducts(selectedProducts.filter((_, idx) => idx !== i))} style={styles.removeBtn}><Trash2 size={16}/></button>
              </div>
            ))}
          </div>

          <div style={styles.advanceSection}>
            <label style={{...styles.label, color: '#c05621'}}><DollarSign size={16} /> Abater Vale ou Antecipação</label>
            <input 
              type="number" 
              min="0"
              style={styles.input} 
              value={advanceAmount} 
              onChange={(e) => setAdvanceAmount(e.target.value)} 
              placeholder="R$ 0,00"
            />
          </div>

          <div style={styles.footer}>
            <div style={styles.totalBox}>
              <div>
                <span style={{fontSize: '13px', color: '#666'}}>Total a Receber</span>
                <h3 style={styles.totalValue}>R$ {finalTotal.toFixed(2)}</h3>
              </div>
              <button 
                onClick={handleFinish} 
                disabled={loading} 
                style={{...styles.finishBtn, backgroundColor: loading ? '#ccc' : COLORS.sageGreen}}
              >
                {loading ? 'Processando...' : 'Finalizar Venda'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { backgroundColor: 'white', width: '95%', maxWidth: '480px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  header: { padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: 0, fontSize: '18px', color: COLORS.deepCharcoal, fontWeight: '800' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#999' },
  content: { padding: '24px' },
  infoCard: { backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' },
  avatarPlaceholder: { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: COLORS.warmSand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  serviceBadge: { backgroundColor: COLORS.sageGreen, color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' },
  label: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#444' },
  select: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', marginBottom: '15px', fontSize: '14px', outline: 'none' },
  miniSelect: { border: 'none', fontSize: '11px', color: '#2563eb', background: 'none', padding: 0, cursor: 'pointer', fontWeight: 'bold' },
  itemRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '12px', marginBottom: '8px' },
  removeBtn: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },
  advanceSection: { marginTop: '20px', padding: '15px', backgroundColor: '#fff8f0', borderRadius: '16px', border: '1px solid #ffe7cc' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none', fontSize: '16px', fontWeight: 'bold', boxSizing: 'border-box' },
  footer: { marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '20px' },
  totalBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  totalValue: { margin: 0, fontSize: '28px', fontWeight: '900', color: COLORS.deepCharcoal },
  finishBtn: { padding: '16px 30px', borderRadius: '12px', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
  whatsappBtn: { backgroundColor: '#25D366', color: 'white', textDecoration: 'none', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' },
  secondaryBtn: { backgroundColor: '#f1f5f9', color: '#475569', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }
};

export default CheckoutModal;