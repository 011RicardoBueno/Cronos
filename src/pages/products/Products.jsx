import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, Plus, Search, AlertTriangle, Edit3, Trash2, Tag, X, Save, Loader2 } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    stock: 0,
    min_stock: 5,
  });
  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const isNumeric = ['price', 'stock', 'min_stock'].includes(name);
    const parsedValue = isNumeric ? (name === 'price' ? parseFloat(value) : parseInt(value, 10)) : value;
    setFormData(prev => ({ ...prev, [name]: isNaN(parsedValue) ? '' : parsedValue }));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name || '',
        price: product.price || 0,
        stock: product.stock || 0,
        min_stock: product.min_stock || 5,
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', price: 0, stock: 0, min_stock: 5 });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'O nome do produto é obrigatório.';
    }
    if (formData.price < 0) {
      errors.price = 'O preço não pode ser negativo.';
    }
    if (formData.stock < 0 || !Number.isInteger(formData.stock)) {
      errors.stock = 'O estoque deve ser um número inteiro >= 0.';
    }
    if (formData.min_stock < 0 || !Number.isInteger(formData.min_stock)) {
      errors.min_stock = 'O estoque mínimo deve ser um número inteiro >= 0.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      let salonId = null;
      if (products.length > 0) {
        salonId = products[0].salon_id;
      } else {
        // Fallback: This should ideally come from a context like useSalon()
        // If there are no products, we can't infer the salon_id.
        // This will cause an error if creating the very first product.
        // A better implementation would involve providing salonId as a prop or from context.
        throw new Error("Não foi possível determinar o ID do salão. Cadastre um serviço ou profissional primeiro.");
      }

      const payload = {
        name: formData.name,
        price: formData.price,
        stock: formData.stock,
        min_stock: formData.min_stock,
        ...(salonId && !editingId ? { salon_id: salonId } : {})
      };

      if (editingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) alert('Erro ao excluir produto: ' + error.message);
    else fetchProducts();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-brand-surface p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-text">Inventário de Produtos</h2>
            <p className="text-sm text-brand-muted">Gerencie seu estoque e produtos de revenda</p>
          </div>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20">
            <Plus size={20} /> Novo Produto
          </button>
        </header>

        {/* BUSCA */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nome do produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-card border border-brand-muted/20 rounded-2xl py-3 pl-12 pr-4 text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
          />
        </div>

        {/* GRID DE CARDS */}
        {loading ? (
          <div className="text-center p-10 text-brand-muted animate-pulse">Carregando estoque...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-brand-card rounded-2xl border border-brand-muted/20 p-5 hover:shadow-xl transition-all group relative overflow-hidden">
                
                {/* STATUS DE ESTOQUE */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    product.stock <= (product.min_stock || 5) 
                    ? 'bg-red-500/10 text-red-500 animate-pulse' 
                    : 'bg-brand-primary/10 text-brand-primary'
                  }`}>
                    {product.stock <= (product.min_stock || 5) ? 'Estoque Baixo' : 'Em Estoque'}
                  </div>
                  <Tag size={16} className="text-brand-muted" />
                </div>

                <h3 className="text-lg font-bold text-brand-text mb-1 truncate">{product.name}</h3>
                <p className="text-xs text-brand-muted mb-4 uppercase tracking-tighter">Qtd: {product.stock} unidades</p>

                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-xs text-brand-muted block">Preço de Venda</span>
                    <span className="text-xl font-black text-brand-primary">R$ {product.price?.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(product)} className="p-2 bg-brand-surface rounded-lg text-brand-muted hover:text-brand-primary transition-colors border border-brand-muted/10">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 bg-brand-surface rounded-lg text-brand-muted hover:text-red-500 transition-colors border border-brand-muted/10">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* ALERTA VISUAL NO FUNDO SE ESTOQUE BAIXO */}
                {product.stock <= (product.min_stock || 5) && (
                  <div className="absolute top-0 right-0 p-2 text-red-500/20">
                    <AlertTriangle size={40} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredProducts.length === 0 && (
          <div className="bg-brand-card rounded-3xl p-12 text-center border border-brand-muted/10">
            <Package size={48} className="mx-auto text-brand-muted/30 mb-4" />
            <h3 className="text-brand-text font-bold text-lg">Nenhum produto encontrado</h3>
            <p className="text-brand-muted text-sm">Tente ajustar sua busca ou cadastrar um novo item.</p>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-brand-card w-full max-w-lg rounded-3xl shadow-2xl border border-brand-muted/20">
            <div className="p-6 border-b border-brand-muted/10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-brand-text">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-brand-surface rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Nome do Produto</label>
                <input 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full bg-brand-surface border rounded-xl p-3 outline-none focus:border-brand-primary transition-all ${formErrors.name ? 'border-red-500' : 'border-brand-muted/20'}`}
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Preço de Venda (R$)</label>
                  <input 
                    type="number"
                    name="price"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`w-full bg-brand-surface border rounded-xl p-3 outline-none focus:border-brand-primary transition-all ${formErrors.price ? 'border-red-500' : 'border-brand-muted/20'}`}
                  />
                  {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Estoque Atual</label>
                  <input 
                    type="number"
                    name="stock"
                    step="1"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className={`w-full bg-brand-surface border rounded-xl p-3 outline-none focus:border-brand-primary transition-all ${formErrors.stock ? 'border-red-500' : 'border-brand-muted/20'}`}
                  />
                  {formErrors.stock && <p className="text-xs text-red-500 mt-1">{formErrors.stock}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-brand-muted uppercase mb-1 block">Estoque Mínimo (Alerta)</label>
                <input 
                  type="number"
                  name="min_stock"
                  step="1"
                  min="0"
                  value={formData.min_stock}
                  onChange={handleInputChange}
                  className={`w-full bg-brand-surface border rounded-xl p-3 outline-none focus:border-brand-primary transition-all ${formErrors.min_stock ? 'border-red-500' : 'border-brand-muted/20'}`}
                />
                {formErrors.min_stock && <p className="text-xs text-red-500 mt-1">{formErrors.min_stock}</p>}
              </div>
            </div>

            <div className="p-6 border-t border-brand-muted/10 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-brand-muted hover:bg-brand-surface transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-3 rounded-xl font-bold bg-brand-primary text-white hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2">
                {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Salvar Produto</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Products;