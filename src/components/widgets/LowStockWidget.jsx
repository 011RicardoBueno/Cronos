import React, { useEffect, useState } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { fetchLowStockProducts } from '../../services/supabaseService';

export default function LowStockWidget({ salonId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salonId) return;

    async function fetchLowStock() {
      try {
        const lowStockProducts = await fetchLowStockProducts(salonId);
        setProducts(lowStockProducts);
      } catch (err) {
        console.error('Error fetching low stock:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLowStock();
  }, [salonId]);

  if (loading) return (
    <div className="bg-brand-card p-6 rounded-2xl border border-brand-muted/20 h-full flex flex-col justify-center">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-brand-muted/10 rounded w-1/2"></div>
        <div className="h-10 bg-brand-muted/10 rounded"></div>
        <div className="h-10 bg-brand-muted/10 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="bg-brand-card p-6 rounded-2xl border border-brand-muted/20 h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
          <AlertTriangle size={20} />
        </div>
        <h3 className="font-semibold text-brand-text">Estoque Baixo</h3>
      </div>

      <div className="space-y-3">
        {products.length === 0 ? (
          <p className="text-sm text-brand-muted">Nenhum produto com estoque baixo.</p>
        ) : (
          products.map((product) => (
            <div key={product.id} className="flex justify-between items-center p-3 bg-brand-surface rounded-xl border border-brand-muted/10">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-brand-muted/10 rounded-md">
                    <Package size={14} className="text-brand-muted" />
                </div>
                <span className="text-sm font-medium text-brand-text truncate max-w-[100px] sm:max-w-[140px]">{product.name}</span>
              </div>
              <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-lg whitespace-nowrap">
                {product.stock_quantity} un
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}