import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants/dashboard';
import { X, DollarSign, Tag, Calendar as CalendarIcon } from 'lucide-react';

export default function ExpenseModal({ isOpen, onClose, salonId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Produtos',
    date: new Date().toISOString().split('T')[0]
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          salon_id: salonId,
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          date: formData.date
        }]);

      if (error) throw error;
      
      onSuccess();
      onClose();
      setFormData({ description: '', amount: '', category: 'Produtos', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar despesa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Novo Lançamento de Saída</h3>
          <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Descrição</label>
            <input 
              required
              placeholder="Ex: Aluguel, Compra de Shampoos..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              style={styles.input}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Valor (R$)</label>
              <input 
                required
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Data</label>
              <input 
                required
                type="date"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Categoria</label>
            <select 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              style={styles.input}
            >
              <option value="Produtos">Produtos</option>
              <option value="Aluguel">Aluguel</option>
              <option value="Marketing">Marketing</option>
              <option value="Utilidades">Utilidades (Luz/Água)</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <button type="submit" disabled={loading} style={styles.saveBtn}>
            {loading ? 'Salvando...' : 'Confirmar Lançamento'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { backgroundColor: 'white', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { margin: 0, fontSize: '1.2rem', color: COLORS.deepCharcoal, fontWeight: '800' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#666' },
  form: { display: 'grid', gap: '15px' },
  inputGroup: { display: 'grid', gap: '6px' },
  label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#555' },
  input: { padding: '12px', borderRadius: '12px', border: '1px solid #ddd', outline: 'none', fontSize: '14px' },
  saveBtn: { marginTop: '10px', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: COLORS.deepCharcoal, color: 'white', fontWeight: 'bold', cursor: 'pointer' }
};