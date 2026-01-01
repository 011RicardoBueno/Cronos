import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Edit3, Trash2, User, Briefcase } from 'lucide-react';

export default function Professionals() {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfessionals();
  }, []);

  async function fetchProfessionals() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProfessionals = professionals.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-brand-surface p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-text">Profissionais</h2>
            <p className="text-sm text-brand-muted">Gerencie sua equipe e comissões</p>
          </div>
          <button className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20">
            <Plus size={20} /> Novo Profissional
          </button>
        </header>

        {/* BUSCA */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-card border border-brand-muted/20 rounded-2xl py-3 pl-12 pr-4 text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
          />
        </div>

        {/* GRID DE CARDS */}
        {loading ? (
          <div className="text-center p-10 text-brand-muted animate-pulse">Carregando equipe...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProfessionals.map((pro) => (
              <div key={pro.id} className="bg-brand-card rounded-3xl border border-brand-muted/20 p-6 hover:shadow-xl transition-all group text-center">
                
                {/* AVATAR */}
                <div className="w-24 h-24 mx-auto rounded-full bg-brand-surface border-2 border-brand-primary/30 p-1 mb-4 overflow-hidden flex items-center justify-center">
                  {pro.avatar_url ? (
                    <img src={pro.avatar_url} alt={pro.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User size={40} className="text-brand-muted/50" />
                  )}
                </div>

                {/* INFO */}
                <h3 className="text-brand-text font-bold text-xl mb-1">{pro.name}</h3>
                <p className="text-brand-muted text-sm flex items-center justify-center gap-1">
                   {pro.specialty || 'Especialista'}
                </p>

                {/* COMISSÃO */}
                <div className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-xs font-bold inline-block mt-2">
                  Comissão: {pro.commission_rate || 0}%
                </div>

                {/* ACTIONS */}
                <div className="flex justify-center gap-3 mt-6 pt-4 border-t border-brand-muted/10">
                  <button className="p-2 rounded-lg text-brand-muted hover:text-brand-primary transition-colors hover:bg-brand-surface">
                    <Edit3 size={20} />
                  </button>
                  <button className="p-2 rounded-lg text-brand-muted hover:text-red-500 transition-colors hover:bg-brand-surface">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredProfessionals.length === 0 && (
          <div className="bg-brand-card rounded-3xl p-12 text-center border border-brand-muted/10">
            <Briefcase size={48} className="mx-auto text-brand-muted/30 mb-4" />
            <h3 className="text-brand-text font-bold text-lg">Nenhum profissional encontrado</h3>
            <p className="text-brand-muted text-sm">Cadastre sua equipe para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}