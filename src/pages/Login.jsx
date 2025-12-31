import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants/dashboard';

const Login = () => {
  const [email, setEmail] = useState(''); // Usado como identificador no Login
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' ou 'signup'
  const [role, setRole] = useState('client'); // 'client' ou 'admin'
  const navigate = useNavigate();

  // Função de Máscara de Telefone
  const formatPhone = (value) => {
    if (!value) return "";
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length <= 11) {
      return cleanValue
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    return cleanValue.substring(0, 11).replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  // Lógica para tratar o input de Login (Telefone ou E-mail)
  const handleLoginIdentifierChange = (e) => {
    const val = e.target.value;
    // Se o valor começar com número, aplica máscara de telefone
    if (/^\d/.test(val.replace(/\D/g, '')) && !val.includes('@')) {
      setEmail(formatPhone(val));
    } else {
      setEmail(val);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const userRole = session.user?.user_metadata?.role;
        if (userRole === 'admin') navigate('/');
        else navigate('/agendamento-cliente');
      }
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setError('');
    
    // Validações Básicas
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) throw new Error('O nome é obrigatório.');
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) throw new Error('Insira um telefone válido com DDD.');

        const finalEmail = email.trim() || `${cleanPhone}@fluxo.com`;

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: finalEmail,
          password,
          options: {
            data: { 
              role: role,
              full_name: fullName.trim(),
              phone: cleanPhone,
              is_temporary_email: !email.trim()
            }
          }
        });

        if (signUpError) throw signUpError;
        if (role === 'admin') navigate('/');
        else navigate('/agendamento-cliente');
        
      } else {
        // Lógica de Login: Trata Telefone Mascarado
        let loginIdentifier = email.trim();
        const cleanId = loginIdentifier.replace(/\D/g, '');
        
        // Se for apenas números, tratamos como telefone
        if (/^\d+$/.test(cleanId) && !loginIdentifier.includes('@')) {
            if (cleanId.length < 10) throw new Error('Telefone incompleto.');
            loginIdentifier = `${cleanId}@fluxo.com`;
        }

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: loginIdentifier,
          password,
        });

        if (signInError) {
          if (signInError.message === 'Invalid login credentials') {
            throw new Error('Telefone/E-mail ou senha incorretos.');
          }
          throw signInError;
        }
        
        const userRole = data.user?.user_metadata?.role;
        if (userRole === 'admin') navigate('/');
        else navigate('/agendamento-cliente');
      }
    } catch (err) {
      setError(err.message === 'User already registered' ? 'Este telefone ou e-mail já está cadastrado.' : err.message);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={styles.title}>Fluxo</h1>
          <p style={styles.subtitle}>Olá, seja bem-vindo!</p>
        </div>

        <div style={styles.tabContainer}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setEmail(''); setPassword(''); }}
            style={{ ...styles.tabButton, 
              backgroundColor: mode === 'login' ? COLORS.white : 'transparent',
              fontWeight: mode === 'login' ? '700' : '400',
              boxShadow: mode === 'login' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setEmail(''); setPassword(''); }}
            style={{ ...styles.tabButton, 
              backgroundColor: mode === 'signup' ? COLORS.white : 'transparent',
              fontWeight: mode === 'signup' ? '700' : '400',
              boxShadow: mode === 'signup' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={styles.label}>Como deseja usar o Fluxo?</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  style={{ ...styles.roleOption, 
                    borderColor: role === 'client' ? COLORS.sageGreen : '#E5E7EB',
                    backgroundColor: role === 'client' ? '#F0FDF4' : 'transparent',
                    color: role === 'client' ? '#166534' : COLORS.deepCharcoal
                  }}
                >
                  Sou Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  style={{ ...styles.roleOption, 
                    borderColor: role === 'admin' ? COLORS.sageGreen : '#E5E7EB',
                    backgroundColor: role === 'admin' ? '#F0FDF4' : 'transparent',
                    color: role === 'admin' ? '#166534' : COLORS.deepCharcoal
                  }}
                >
                  Sou um Salão
                </button>
              </div>
              
              <div style={styles.roleInfoBox}>
                 <p style={styles.infoText}>
                   {role === 'client' 
                     ? "Busque salões próximos e agende seus horários online."
                     : "Tenha acesso a ferramentas de gestão, agenda e profissionais."
                   }
                 </p>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={styles.label}>Nome Completo *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: João Silva"
                style={styles.input}
                required
              />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>
              {mode === 'signup' ? 'WhatsApp / Telefone *' : 'Telefone ou E-mail'}
            </label>
            <input
              type="text"
              value={mode === 'signup' ? phone : email}
              onChange={(e) => mode === 'signup' ? setPhone(formatPhone(e.target.value)) : handleLoginIdentifierChange(e)}
              placeholder={mode === 'signup' ? '(00) 00000-0000' : 'Seu telefone ou e-mail'}
              style={styles.input}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Senha *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              required
            />
          </div>

          {mode === 'signup' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={styles.label}>E-mail <span style={{ fontWeight: '400', color: '#9CA3AF' }}>(Opcional)</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Para receber seus comprovantes"
                style={styles.input}
              />
            </div>
          )}

          {error && <div style={styles.errorBox}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitButton, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Processando...' : (mode === 'signup' ? 'Criar minha conta' : 'Entrar na conta')}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: COLORS.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: { backgroundColor: COLORS.white, borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 50px rgba(0,0,0,0.08)' },
  title: { fontSize: '32px', fontWeight: '800', color: COLORS.deepCharcoal, marginBottom: '8px' },
  subtitle: { fontSize: '18px', color: '#6B7280', marginBottom: '0' },
  tabContainer: { display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '12px', padding: '4px', marginBottom: '32px' },
  tabButton: { flex: 1, padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s', color: COLORS.deepCharcoal },
  label: { display: 'block', fontSize: '14px', fontWeight: '700', color: COLORS.deepCharcoal, marginBottom: '8px' },
  input: { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '16px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' },
  roleOption: { flex: 1, padding: '12px', border: '2px solid', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', textAlign: 'center', transition: 'all 0.2s', fontWeight: '600' },
  roleInfoBox: { padding: '12px 16px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #F3F4F6', minHeight: '44px', display: 'flex', alignItems: 'center' },
  infoText: { margin: 0, fontSize: '13px', color: '#4B5563', lineHeight: '1.4', textAlign: 'center', width: '100%' },
  submitButton: { width: '100%', padding: '16px', backgroundColor: COLORS.sageGreen, color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' },
  errorBox: { padding: '12px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', textAlign: 'center', border: '1px solid #FEE2E2' }
};

export default Login;