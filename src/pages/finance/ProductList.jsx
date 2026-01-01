import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Filter, AlertTriangle, Package } from 'lucide-react';
import BackButton from '../../components/ui/BackButton';

export default function ProductList() {
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
        <BackButton />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-brand-text">Inventário de Produtos</h1>
            <p className="text-sm text-brand-muted">Gerencie seu estoque e preços</p>
          </div>
          
          <button className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl hover:bg-brand-primary/90 transition-all shadow-sm shadow-brand-primary/20">
            <Plus size={20} />
            <span className="font-medium">Novo Produto</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 flex items-center gap-3 w-full bg-brand-surface border border-brand-muted/20 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-brand-primary/50 transition-all">
            <Search size={20} className="text-brand-muted" />
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none text-brand-text w-full placeholder:text-brand-muted"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-brand-muted hover:text-brand-text hover:bg-brand-surface rounded-xl transition-colors border border-transparent hover:border-brand-muted/20">
            <Filter size={18} />
            <span>Filtros</span>
          </button>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="bg-brand-card rounded-2xl border border-brand-muted/20 p-5 hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-brand-surface rounded-lg text-brand-primary group-hover:bg-brand-primary/10 transition-colors">
                    <Package size={20} />
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded-lg border ${
                    product.quantity < 5 
                      ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' 
                      : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                  }`}>
                    {product.quantity < 5 ? 'BAIXO ESTOQUE' : `${product.quantity} un`}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-brand-text mb-1">{product.name}</h3>
                <p className="text-sm text-brand-muted mb-4 line-clamp-2">{product.description || 'Sem descrição'}</p>
              </div>

              <div className="pt-4 border-t border-brand-muted/10">
                <span className="block text-xs text-brand-muted uppercase font-bold mb-1">Preço de Venda</span>
                <span className="text-xl font-bold text-brand-primary">R$ {product.price?.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}