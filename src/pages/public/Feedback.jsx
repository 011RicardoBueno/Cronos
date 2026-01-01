import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Star, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';
import { COLORS } from '../../constants/dashboard';

export default function Feedback() {
  const { slotId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [slotData, setSlotData] = useState(null);

  useEffect(() => {
    const checkReviewAndFetchSlot = async () => {
      try {
        // 1. Verifica se já existe avaliação para este slot
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('slot_id', slotId) // Adicione esta coluna na tabela reviews se possível
          .single();

        if (existingReview) {
          setAlreadyReviewed(true);
          setLoading(false);
          return;
        }

        // 2. Busca dados do agendamento
        const { data, error } = await supabase
          .from('slots')
          .select(`
            id, 
            client_name, 
            professional_id, 
            salon_id,
            professionals (name),
            services (name)
          `)
          .eq('id', slotId)
          .single();

        if (error || !data) throw new Error("Não encontrado");
        setSlotData(data);
      } catch (err) {
        console.error("Erro ao carregar link de avaliação:", err);
      } finally {
        setLoading(false);
      }
    };
    checkReviewAndFetchSlot();
  }, [slotId]);

  const handleSubmit = async () => {
    if (rating === 0) return alert("Por favor, selecione uma nota de 1 a 5 estrelas.");

    try {
      const { error } = await supabase.from('reviews').insert([{
        salon_id: slotData.salon_id,
        professional_id: slotData.professional_id,
        slot_id: slotData.id, // Vínculo direto para evitar duplicidade
        rating,
        comment: comment.trim()
      }]);

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Houve um problema ao salvar sua avaliação. Tente novamente.");
    }
  };

  if (loading) return <div style={styles.container}><p>Carregando...</p></div>;

  if (alreadyReviewed || submitted) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <CheckCircle size={60} color={COLORS.sageGreen} style={{ marginBottom: '15px' }} />
        <h2 style={{ color: COLORS.deepCharcoal }}>Avaliação Concluída!</h2>
        <p style={{ color: '#666' }}>Muito obrigado. Sua opinião é fundamental para mantermos a qualidade do nosso atendimento.</p>
      </div>
    </div>
  );

  if (!slotData) return (
    <div style={styles.container}>
      <AlertCircle size={60} color="#ef4444" style={{ marginBottom: '15px' }} />
      <h2>Link Inválido</h2>
      <p>Este link de avaliação expirou ou não existe.</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.avatar}>
          {slotData.professionals?.name?.charAt(0).toUpperCase()}
        </div>
        <h2 style={{ marginBottom: '5px', fontSize: '1.4rem' }}>Como foi seu atendimento?</h2>
        <p style={{ color: '#666', marginBottom: '25px', fontSize: '15px' }}>
          Conte-nos sobre o trabalho de <strong>{slotData.professionals?.name}</strong> no serviço de <strong>{slotData.services?.name}</strong>.
        </p>

        <div style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={42}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              fill={(hover || rating) >= s ? "#FFD700" : "none"}
              color={(hover || rating) >= s ? "#FFD700" : "#D1D5DB"}
              style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
              className="star-icon"
            />
          ))}
        </div>

        <div style={{ width: '100%', marginTop: '10px' }}>
          <label style={styles.label}><MessageSquare size={16}/> Comentário (opcional)</label>
          <textarea
            style={styles.textarea}
            placeholder="O que você mais gostou no atendimento?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <button 
          onClick={handleSubmit} 
          style={{ 
            ...styles.btn, 
            opacity: rating === 0 ? 0.6 : 1,
            cursor: rating === 0 ? 'not-allowed' : 'pointer'
          }}
          disabled={rating === 0}
        >
          Finalizar Avaliação
        </button>
      </div>
      
      <p style={{ marginTop: '30px', fontSize: '12px', color: '#999' }}>
        Sistema de Gestão <strong>{slotData.salon_name || 'BeautySaaS'}</strong>
      </p>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', padding: '20px' },
  card: { backgroundColor: 'white', padding: '40px 25px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  avatar: { width: '60px', height: '60px', backgroundColor: COLORS.warmSand, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: COLORS.deepCharcoal, marginBottom: '15px' },
  starsRow: { display: 'flex', gap: '8px', margin: '10px 0 25px 0' },
  label: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', color: '#4B5563', marginBottom: '8px' },
  textarea: { width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #E5E7EB', height: '110px', outline: 'none', boxSizing: 'border-box', fontSize: '15px', resize: 'none' },
  btn: { width: '100%', marginTop: '25px', padding: '18px', borderRadius: '14px', border: 'none', backgroundColor: COLORS.sageGreen, color: 'white', fontWeight: 'bold', fontSize: '16px', transition: 'all 0.2s' }
};