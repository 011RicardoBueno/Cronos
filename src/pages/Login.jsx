import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants/dashboard';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' ou 'signup'
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Cadastro
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/setup`
          }
        });

        if (error) throw error;
        
        alert('Cadastro realizado! Verifique seu email para confirmar.');
        // Volta para o login após cadastro
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
        
        console.log('Login bem-sucedido:', data.user.id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
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
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Botão Principal */}
          <button
            type="submit"
            disabled={loading}
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
            {loading ? 'Processando...' : (mode === 'signup' ? 'Criar Conta' : 'Entrar na Conta')}
          </button>

          {/* Mensagem de ajuda */}
          {mode === 'signup' && (
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              color: '#0369a1',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginTop: '20px'
            }}>
              <p style={{ margin: 0 }}>
                <strong>Importante:</strong> Após o cadastro, verifique seu email para confirmar a conta.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;