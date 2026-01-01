import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, Plus, Search, AlertTriangle, Edit3, Trash2, Tag } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
          <button className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20">
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
                    <button className="p-2 bg-brand-surface rounded-lg text-brand-muted hover:text-brand-primary transition-colors border border-brand-muted/10">
                      <Edit3 size={16} />
                    </button>
                    <button className="p-2 bg-brand-surface rounded-lg text-brand-muted hover:text-red-500 transition-colors border border-brand-muted/10">
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
    </div>
  );
};
export default Products;