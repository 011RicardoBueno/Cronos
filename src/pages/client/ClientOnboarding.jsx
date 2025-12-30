import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/dashboard';

const ClientOnboarding = ({ user, onComplete }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    marketing_consent: true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Atualizamos os metadados do Auth e/ou a tabela de usuários
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          marketing_consent: formData.marketing_consent,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (error) throw error;
      onComplete(); // Libera para a tela de Explorar Salões
    } catch (err) {
      alert("Erro ao salvar seus dados: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Olá! Seja bem-vindo(a)</h2>
        <p style={styles.subtitle}>Como o salão deve te identificar para confirmar seus agendamentos?</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nome Completo</label>
            <input
              required
              style={styles.input}
              placeholder="Ex: Maria Silva"
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>WhatsApp / Celular</label>
            <input
              required
              type="tel"
              style={styles.input}
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div style={styles.consentContainer}>
            <input
              type="checkbox"
              id="consent"
              checked={formData.marketing_consent}
              onChange={e => setFormData({...formData, marketing_consent: e.target.checked})}
            />
            <label htmlFor="consent" style={styles.consentLabel}>
              Aceito receber lembretes e promoções exclusivas via WhatsApp.
            </label>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Salvando...' : 'Começar a Agendar'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.offWhite, padding: '20px' },
  card: { backgroundColor: '#fff', padding: '40px', borderRadius: '16px', maxWidth: '400px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
  title: { color: COLORS.deepCharcoal, fontSize: '24px', textAlign: 'center', marginBottom: '10px' },
  subtitle: { color: '#666', textAlign: 'center', fontSize: '14px', marginBottom: '30px' },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: COLORS.deepCharcoal },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${COLORS.warmSand}`, boxSizing: 'border-box' },
  consentContainer: { display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '30px' },
  consentLabel: { fontSize: '13px', color: '#666', lineHeight: '1.4' },
  button: { width: '100%', padding: '15px', borderRadius: '8px', border: 'none', backgroundColor: COLORS.sageGreen, color: '#fff', fontWeight: 'bold', cursor: 'pointer' }
};

export default ClientOnboarding;
