import React, { useState, useEffect } from 'react';
import { useSalon } from '../../context/SalonContext';
import { supabase } from '../../lib/supabase';
import { fetchProducts } from '../../services/supabaseService';
import { COLORS } from '../../constants/dashboard';
import BackButton from '../../components/ui/BackButton';
import { Package, Plus, Trash2, AlertCircle } from 'lucide-react';

const Products = () => {
  const { salon } = useSalon();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    commission_rate: '10',
    stock_quantity: ''
  });

  const loadProducts = React.useCallback(async () => {
    if (!salon?.id) return;
    try {
      setLoading(true);
      const data = await fetchProducts(salon.id);
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [salon?.id]);

  useEffect(() => {
    loadProducts();
  }, [salon?.id, loadProducts]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    // Validação extra antes de enviar ao banco
    const price = parseFloat(formData.price);
    const commission = parseFloat(formData.commission_rate);
    const stock = parseInt(formData.stock_quantity || 0);

    if (price < 0 || commission < 0 || stock < 0) {
      alert("Valores negativos não são permitidos.");
      return;
    }

    if (!formData.name || isNaN(price) || !salon?.id) return;

    try {
      setIsAdding(true);
      const { error } = await supabase
        .from('products')
        .insert([{ 
          salon_id: salon.id,
          name: formData.name,
          price: price,
          commission_rate: commission,
          stock_quantity: stock
        }]);

      if (error) throw error;

      setFormData({ name: '', price: '', commission_rate: '10', stock_quantity: '' });
      await loadProducts();
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar produto: ' + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div style={{ backgroundColor: COLORS.offWhite, minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <BackButton colors={COLORS} />
        
        <header style={{ marginBottom: '30px' }}>
          <h1 style={{ color: COLORS.deepCharcoal, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package size={32} color={COLORS.sageGreen} /> Gestão de Inventário
          </h1>
          <p style={{ color: '#666' }}>Cadastre produtos e defina comissões de venda.</p>
        </header>

        <div style={styles.card}>
          <form onSubmit={handleAddProduct} style={styles.formGrid}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={styles.label}>Nome do Produto</label>
              <input
                required
                placeholder="Ex: Shampoo Pós-Química"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Preço (R$)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Estoque Inicial</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Comissão (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.commission_rate}
                onChange={(e) => setFormData({...formData, commission_rate: e.target.value})}
                style={styles.input}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="submit"
                disabled={isAdding}
                style={{ ...styles.addBtn, backgroundColor: isAdding ? '#ccc' : COLORS.sageGreen }}
              >
                {isAdding ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>

        <div style={{ display: 'grid', gap: '15px' }}>
          {!loading && products.map(prod => (
            <div key={prod.id} style={styles.productRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={styles.iconBox}><Package size={20} /></div>
                <div>
                  <span style={styles.prodName}>{prod.name}</span>
                  <div style={styles.prodMeta}>
                    <span>Estoque: <strong>{prod.stock_quantity}</strong></span>
                    <span style={{ margin: '0 8px' }}>•</span>
                    <span>Comissão: {prod.commission_rate}%</span>
                  </div>
                </div>
              </div>
              <span style={styles.prodPrice}>R$ {prod.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: { backgroundColor: 'white', padding: '24px', borderRadius: '16px', marginBottom: '30px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${COLORS.warmSand}` },
  addBtn: { width: '100%', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  productRow: { backgroundColor: 'white', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${COLORS.warmSand}` },
  iconBox: { width: '40px', height: '40px', backgroundColor: COLORS.warmSand, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  prodName: { fontWeight: '600' },
  prodMeta: { fontSize: '12px', color: '#888' },
  prodPrice: { fontWeight: '800' }
};

export default Products;