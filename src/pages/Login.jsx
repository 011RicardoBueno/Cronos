import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Cores adaptadas para o efeito Glassmorphism mais transparente
  const colors = {
    dustyRose: "#DBC4C4",
    deepCharcoal: "#403D39",
    // Branco com mais transparência (de 0.92 para 0.65)
    glassWhite: "rgba(255, 255, 255, 0.65)", 
    inputWhite: "rgba(255, 255, 255, 0.4)",
  }

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) alert(error.message)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      // Gradiente linear usando as cores da sua paleta (Warm Sand e Off-White)
      background: 'linear-gradient(135deg, #F3EEEA 0%, #E7D8D8 50%, #DBC4C4 100%)',
      position: 'relative'
    }}>
      
      {/* Card com Glassmorphism Reforçado */}
      <div style={{ 
        backgroundColor: colors.glassWhite, 
        padding: '48px 40px', 
        borderRadius: '32px', 
        // Sombra mais difusa para flutuar sobre o gradiente
        boxShadow: '0 15px 35px rgba(0,0,0,0.05)',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center',
        // Borda sutil que brilha (efeito vidro)
        border: '1px solid rgba(255, 255, 255, 0.5)',
        // O "Blur" que faz o efeito de vidro acontecer atrás do card
        backdropFilter: 'blur(16px)', 
        WebkitBackdropFilter: 'blur(16px)', // Suporte para Safari
        zIndex: 1
      }}>
        <h1 style={{ 
          color: colors.deepCharcoal, 
          fontSize: '2.8rem', 
          fontWeight: '300', 
          marginBottom: '8px',
          letterSpacing: '-1.5px'
        }}>
          Cronos
        </h1>
        <p style={{ color: colors.deepCharcoal, marginBottom: '40px', opacity: 0.6, fontWeight: '400', fontSize: '0.95rem' }}>
          Agenda Profissional
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ color: colors.deepCharcoal, fontSize: '0.8rem', marginLeft: '4px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.7 }}>
              E-mail
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle(colors)}
            />
          </div>

          <div style={{ marginBottom: '32px', textAlign: 'left' }}>
            <label style={{ color: colors.deepCharcoal, fontSize: '0.8rem', marginLeft: '4px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.7 }}>
              Senha
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={inputStyle(colors)}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: colors.dustyRose,
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 10px 20px rgba(219, 196, 196, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'Autenticando...' : 'Acessar Painel'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle = (colors) => ({
  width: '100%',
  padding: '16px',
  marginTop: '8px',
  borderRadius: '14px',
  border: '1px solid rgba(0,0,0,0.03)',
  // Inputs levemente transparentes para combinar com o card
  backgroundColor: colors.inputWhite,
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box',
  color: colors.deepCharcoal,
  transition: 'background-color 0.2s'
})