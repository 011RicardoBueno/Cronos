import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants/dashboard';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' ou 'signup'
  const [role, setRole] = useState('client'); // 'client' ou 'admin'
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const userRole = session.user?.user_metadata?.role;
        if (userRole === 'admin') {
          navigate('/');
        } else {
          navigate('/agendamento-cliente');
        }
      }
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: role },
            // ALTERAÇÃO: Redireciona para a raiz. 
            // O useEffect do Login decidirá para onde ir com base na role.
            emailRedirectTo: `${window.location.origin}/` 
          }
        });

        if (error) throw error;
        
        alert('Conta criada com sucesso! Você já pode acessar o sistema.');
        setMode('login');
        setEmail('');
        setPassword('');
        
      } else {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        // Redirecionamento baseado na role após login
        const userRole = data.user?.user_metadata?.role;
        if (userRole === 'admin') {
          navigate('/');
        } else {
          navigate('/agendamento-cliente');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: COLORS.offWhite,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: COLORS.white,
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        padding: '40px',
        width: '100%',
        maxWidth: '440px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            color: COLORS.deepCharcoal,
            marginBottom: '10px',
            fontSize: '32px',
            fontWeight: '700'
          }}>
            Cronos
          </h1>
          <p style={{
            color: '#666',
            fontSize: '16px'
          }}>
            {mode === 'signup' ? 'Crie sua conta' : 'Acesse sua conta'}
          </p>
        </div>

        {/* Botões de Modo */}
        <div style={{
          display: 'flex',
          marginBottom: '32px',
          backgroundColor: COLORS.warmSand,
          borderRadius: '8px',
          padding: '4px'
        }}>
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: mode === 'login' ? COLORS.white : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: mode === 'login' ? COLORS.deepCharcoal : '#666',
              fontWeight: mode === 'login' ? '600' : '400',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: mode === 'signup' ? COLORS.white : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: mode === 'signup' ? COLORS.deepCharcoal : '#666',
              fontWeight: mode === 'signup' ? '600' : '400',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Cadastrar
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          {/* Seletor de Tipo de Usuário - Apenas no Cadastro */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                color: COLORS.deepCharcoal,
                fontWeight: '600',
                fontSize: '14px'
              }}>
                Tipo de conta
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    border: `2px solid ${role === 'client' ? COLORS.sageGreen : COLORS.warmSand}`,
                    backgroundColor: role === 'client' ? '#F4F7F0' : COLORS.white,
                    color: COLORS.deepCharcoal,
                    fontWeight: role === 'client' ? '700' : '400',
                    transition: 'all 0.2s'
                  }}
                >
                  Sou Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    border: `2px solid ${role === 'admin' ? COLORS.sageGreen : COLORS.warmSand}`,
                    backgroundColor: role === 'admin' ? '#F4F7F0' : COLORS.white,
                    color: COLORS.deepCharcoal,
                    fontWeight: role === 'admin' ? '700' : '400',
                    transition: 'all 0.2s'
                  }}
                >
                  Sou um Salão
                </button>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: COLORS.deepCharcoal,
              fontWeight: '500',
              fontSize: '14px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: `1px solid ${COLORS.dustyRose}`,
                borderRadius: '8px',
                fontSize: '16px',
                color: COLORS.deepCharcoal,
                backgroundColor: COLORS.offWhite,
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: COLORS.deepCharcoal,
              fontWeight: '500',
              fontSize: '14px'
            }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: `1px solid ${COLORS.dustyRose}`,
                borderRadius: '8px',
                fontSize: '16px',
                color: COLORS.deepCharcoal,
                backgroundColor: COLORS.offWhite,
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px',
              border: '1px solid #fee2e2'
            }}>
              {error}
            </div>
          )}

          {/* Botão Principal */}
          <button
            type="submit"
            disabled={loading || isSubmitting}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: COLORS.sageGreen,
              color: COLORS.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.2s',
              marginBottom: '20px'
            }}
          >
            {loading ? 'Processando...' : (mode === 'signup' ? 'Criar Minha Conta' : 'Entrar na Conta')}
          </button>

          {/* Mensagem de ajuda informativa */}
          {mode === 'signup' && (
            <div style={{
              backgroundColor: '#F8F9FA',
              border: `1px solid ${COLORS.warmSand}`,
              color: COLORS.deepCharcoal,
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              marginTop: '20px',
              lineHeight: '1.4'
            }}>
              <p style={{ margin: 0 }}>
                <strong>{role === 'admin' ? 'Perfil Salão:' : 'Perfil Cliente:'}</strong> 
                {role === 'admin' 
                  ? ' Você terá acesso a ferramentas de gestão, agenda e profissionais.' 
                  : ' Você poderá buscar salões próximos e agendar seus horários online.'}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;