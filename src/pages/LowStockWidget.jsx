import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, Package, ChevronRight, Loader2 } from 'lucide-react';

export default function LowStockWidget({ salonId }) {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salonId) return;

    const fetchLowStock = async () => {
      setLoading(true);
      try {
        // This RPC function is more efficient as it performs the filter on the database side.
        const { data, error } = await supabase
          .rpc('get_low_stock_products', { p_salon_id: salonId });

        if (error) throw error;
        setLowStockProducts(data);
      } catch (err) {
        console.error("Erro ao buscar produtos com baixo estoque:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLowStock();
  }, [salonId]);

  return (
    <div className="bg-brand-card p-6 rounded-2xl border border-brand-muted/20 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-brand-text">Estoque Baixo</h3>
        <AlertTriangle size={20} className="text-amber-500" />
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-brand-muted" /></div>
      ) : lowStockProducts.length > 0 ? (
        <div className="space-y-3 flex-1 overflow-y-auto pr-2">
          {lowStockProducts.map(product => (
            <div key={product.id} className="flex justify-between items-center p-3 bg-brand-surface rounded-xl border border-brand-muted/10">
              <p className="font-bold text-brand-text text-sm">{product.name}</p>
              <span className="text-sm font-bold bg-red-500/10 text-red-500 px-2 py-1 rounded-md">{product.stock} un.</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-brand-muted"><Package size={32} className="mb-2 opacity-50" /><p className="text-sm font-medium">Nenhum produto com estoque baixo.</p></div>
      )}

      <div className="mt-4 pt-4 border-t border-brand-muted/10"><Link to="/produtos" className="flex items-center justify-center gap-2 text-sm font-bold text-brand-primary hover:underline">Ver Inventário Completo<ChevronRight size={16} /></Link></div>
    </div>
  );
}