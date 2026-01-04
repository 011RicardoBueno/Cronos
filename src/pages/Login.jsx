import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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

        const { data: _data, error: signUpError } = await supabase.auth.signUp({
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
      console.error(err);
      setError(err.message === 'User already registered' ? 'Este telefone ou e-mail já está cadastrado.' : err.message);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center p-4">
      <div className="bg-brand-card rounded-3xl p-8 md:p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-brand-text mb-2">Fluxo</h1>
          <p className="text-lg text-brand-muted">Olá, seja bem-vindo!</p>
        </div>

        <div className="flex bg-brand-surface rounded-xl p-1 mb-8">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setEmail(''); setPassword(''); }}
            className={`flex-1 p-3 rounded-lg text-sm font-bold transition-all ${
              mode === 'login' ? 'bg-brand-card shadow-sm text-brand-text' : 'text-brand-muted'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setEmail(''); setPassword(''); }}
            className={`flex-1 p-3 rounded-lg text-sm font-bold transition-all ${
              mode === 'signup' ? 'bg-brand-card shadow-sm text-brand-text' : 'text-brand-muted'
            }`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-brand-text">Como deseja usar o Fluxo?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`flex-1 p-3 border-2 rounded-xl text-sm font-semibold transition-all ${
                    role === 'client' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-brand-muted/20 text-brand-muted'
                  }`}
                >
                  Sou Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex-1 p-3 border-2 rounded-xl text-sm font-semibold transition-all ${
                    role === 'admin' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-brand-muted/20 text-brand-muted'
                  }`}
                >
                  Sou um Salão
                </button>
              </div>
              
              <div className="p-3 bg-brand-surface rounded-xl border border-brand-muted/10 min-h-[44px] flex items-center justify-center">
                 <p className="text-xs text-brand-muted text-center">
                   {role === 'client' 
                     ? "Busque salões próximos e agende seus horários online."
                     : "Tenha acesso a ferramentas de gestão, agenda e profissionais."
                   }
                 </p>
              </div>
            </div>
          )}

          {mode === 'signup' && (<div>
            <label className="block text-sm font-bold text-brand-text mb-2">Nome Completo *</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ex: João Silva" className="w-full p-3 bg-brand-surface border border-brand-muted/20 rounded-xl outline-none focus:border-brand-primary" required />
          </div>)}

          <div>
            <label className="block text-sm font-bold text-brand-text mb-2">
              {mode === 'signup' ? 'WhatsApp / Telefone *' : 'Telefone ou E-mail'}
            </label>
            <input type="text" value={mode === 'signup' ? phone : email} onChange={(e) => mode === 'signup' ? setPhone(formatPhone(e.target.value)) : handleLoginIdentifierChange(e)} placeholder={mode === 'signup' ? '(00) 00000-0000' : 'Seu telefone ou e-mail'} className="w-full p-3 bg-brand-surface border border-brand-muted/20 rounded-xl outline-none focus:border-brand-primary" required />
          </div>

          <div>
            <label className="block text-sm font-bold text-brand-text mb-2">Senha *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 bg-brand-surface border border-brand-muted/20 rounded-xl outline-none focus:border-brand-primary" required />
          </div>

          {mode === 'signup' && (<div>
            <label className="block text-sm font-bold text-brand-text mb-2">E-mail <span className="font-normal text-brand-muted">(Opcional)</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Para receber seus comprovantes" className="w-full p-3 bg-brand-surface border border-brand-muted/20 rounded-xl outline-none focus:border-brand-primary" />
          </div>)}

          {error && <div className="p-3 bg-red-500/10 text-red-600 border border-red-500/20 rounded-xl text-sm text-center">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-brand-primary text-white rounded-xl text-base font-bold transition-all hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Processando...' : (mode === 'signup' ? 'Criar minha conta' : 'Entrar na conta')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;