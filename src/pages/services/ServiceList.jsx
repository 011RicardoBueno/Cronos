import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Scissors, Clock, MoreHorizontal } from 'lucide-react';
import BackButton from '../../components/ui/BackButton';

export default function ServiceList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-brand-surface p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <BackButton />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-brand-text">Catálogo de Serviços</h1>
            <p className="text-sm text-brand-muted">Gerencie os serviços oferecidos</p>
          </div>
          
          <button className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm shadow-brand-primary/20">
            <Plus size={20} />
            <span className="font-medium">Novo Serviço</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-brand-card p-4 rounded-2xl border border-brand-muted/20 shadow-sm mb-6 focus-within:ring-2 focus-within:ring-brand-primary/50 transition-all">
          <div className="flex items-center gap-3 w-full bg-brand-surface/50 p-2 rounded-xl border border-brand-muted/10">
            <Search size={20} className="text-brand-muted" />
            <input 
              type="text" 
              placeholder="Buscar serviços..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none text-brand-text w-full placeholder:text-brand-muted/70"
            />
          </div>
        </div>

        {/*   <button className="absolute top-4 right-4 text-brand-muted hover:text-brand-text">
                <MoreHorizontal size={20} />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-brand-surface rounded-xl text-brand-accent group-hover:bg-brand-accent/10 transition-colors">
                  <Scissors size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-text">{service.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-brand-muted">
                    <Clock size={12} />
                    <span>{service.duration || 30} min</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-brand-muted mb-4 line-clamp-2 min-h-[40px]">
                {service.description || 'Sem descrição disponível para este serviço.'}
              </p>

              <div className="pt-4 border-t border-brand-muted/10 flex justify-between items-center">
                <span className="text-xs text-brand-muted uppercase font-bold">Valor</span>
                <span className="text-xl font-bold text-brand-primary">
                  R$ {service.price?.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}