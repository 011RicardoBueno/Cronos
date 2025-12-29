import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
  setLoading(true)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  setLoading(false)

  if (error) {
    console.error('Login error:', error)
    alert(error.message)
    return
  }

  console.log('Login success:', data)
  alert('Login realizado com sucesso')
}


  return (
    <div style={{ padding: 32 }}>
      <h1>Cronos</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </div>
  )
}
