import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff } from 'lucide-react'; // Import icons

const Login = () => {
  const [email, setEmail] = useState(''); // Usado como identificador no Login
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(''); // General error message
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [mode, setMode] = useState('login'); // 'login', 'signup' ou 'forgot_password'
  const [role, setRole] = useState('client'); // 'client' ou 'admin'
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
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
    setEmailError(''); // Clear error on change
  };

  const validateForm = (currentMode) => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setFullNameError('');
    setPhoneError('');
    setError(''); // Clear general error on re-validation

    // Email/Phone validation
    if (currentMode === 'login' || currentMode === 'forgot_password') {
      if (!email.trim()) {
        setEmailError('Telefone ou E-mail é obrigatório.');
        isValid = false;
      }
    } else if (currentMode === 'signup') {
      if (!phone.trim()) {
        setPhoneError('Telefone é obrigatório.');
        isValid = false;
      } else {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          setPhoneError('Insira um telefone válido com DDD (mín. 10 dígitos).');
          isValid = false;
        }
      }
      if (!fullName.trim()) {
        setFullNameError('Nome Completo é obrigatório.');
        isValid = false;
      }
      // Email is mandatory for signup as per user's request
      if (!email.trim()) {
        setEmailError('E-mail é obrigatório para cadastro.');
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        setEmailError('E-mail inválido.');
        isValid = false;
      }
    }

    // Password validation
    if (currentMode === 'login' || currentMode === 'signup') {
      if (!password) {
        setPasswordError('Senha é obrigatória.');
        isValid = false;
      } else if (password.length < 6) {
        setPasswordError('A senha deve ter pelo menos 6 caracteres.');
        isValid = false;
      }
    }
    return isValid;
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
    
    if (!validateForm(mode)) {
      setError('Por favor, corrija os erros no formulário.');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const cleanPhone = phone.replace(/\D/g, '');
        const finalEmail = email.trim(); // Email is now mandatory for signup

        const { data: _data, error: signUpError } = await supabase.auth.signUp({
          email: finalEmail,
          password,
          options: {
            data: { 
              role: role,
              full_name: fullName.trim(),
              phone: cleanPhone,
            }
          }
        });

        if (signUpError) throw signUpError;
        if (role === 'admin') navigate('/');
        else navigate('/agendamento-cliente');
        
      } else { // mode === 'login'
        let loginIdentifier = email.trim();
        const cleanId = loginIdentifier.replace(/\D/g, '');
        
        // Se for apenas números, tratamos como telefone
        if (/^\d+$/.test(cleanId) && !loginIdentifier.includes('@')) {
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


  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    
    if (!validateForm('forgot_password')) {
      setError('Por favor, insira seu e-mail.');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`, // This URL should be a page where the user can set a new password
      });

      if (resetError) throw resetError;

      setError('Link de redefinição enviado! Verifique seu e-mail.');
      setMode('login'); // Redirect to login after sending email
      setEmail(''); // Clear email after sending reset link
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao enviar o link de redefinição.');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setError('');
    setIsSubmitting(true);
    setLoading(true);
    try {
      const { error: socialError } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`, // Needs a callback route in our app
        },
      });
      if (socialError) throw socialError;
    } catch (err) {
      console.error(err);
      setError(err.message || `Erro ao autenticar com ${provider}.`);
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
            onClick={() => { setMode('login'); setError(''); setEmail(''); setPassword(''); setEmailError(''); setPasswordError(''); setFullNameError(''); setPhoneError(''); }}
            className={`flex-1 p-3 rounded-lg text-sm font-bold transition-all ${
              mode === 'login' ? 'bg-brand-card shadow-sm text-brand-text' : 'text-brand-muted'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setEmail(''); setPassword(''); setPhone(''); setEmailError(''); setPasswordError(''); setFullNameError(''); setPhoneError(''); }}
            className={`flex-1 p-3 rounded-lg text-sm font-bold transition-all ${
              mode === 'signup' ? 'bg-brand-card shadow-sm text-brand-text' : 'text-brand-muted'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {(mode === 'login' || mode === 'signup') && (
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
              <input 
                type="text" 
                value={fullName} 
                onChange={(e) => { setFullName(e.target.value); setFullNameError(''); }} 
                placeholder="Ex: João Silva" 
                className={`w-full p-3 bg-brand-surface border rounded-xl outline-none ${fullNameError ? 'border-red-500 focus:border-red-500' : 'border-brand-muted/20 focus:border-brand-primary'}`} 
                required 
              />
              {fullNameError && <p className="text-red-500 text-xs mt-1">{fullNameError}</p>}
            </div>)}

            <div>
              <label className="block text-sm font-bold text-brand-text mb-2">
                {mode === 'signup' ? 'WhatsApp / Telefone *' : 'Telefone ou E-mail'}
              </label>
              <input 
                type="text" 
                value={mode === 'signup' ? phone : email} 
                onChange={(e) => {
                  if (mode === 'signup') {
                    setPhone(formatPhone(e.target.value));
                    setPhoneError(''); // Clear error on change
                  } else {
                    handleLoginIdentifierChange(e);
                  }
                }} 
                placeholder={mode === 'signup' ? '(00) 00000-0000' : 'Seu telefone ou e-mail'} 
                className={`w-full p-3 bg-brand-surface border rounded-xl outline-none ${
                  (mode === 'signup' && phoneError) || ((mode === 'login' || mode === 'forgot_password') && emailError) ? 'border-red-500 focus:border-red-500' : 'border-brand-muted/20 focus:border-brand-primary'
                }`} 
                required 
              />
              {mode === 'signup' && phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
              {(mode === 'login' || mode === 'forgot_password') && emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-text mb-2">Senha *</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }} 
                  placeholder="••••••••" 
                  className={`w-full p-3 bg-brand-surface border rounded-xl outline-none pr-10 ${passwordError ? 'border-red-500 focus:border-red-500' : 'border-brand-muted/20 focus:border-brand-primary'}`} 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-muted focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => { setMode('forgot_password'); setError(''); setEmail(''); setEmailError(''); }}
                  className="mt-2 text-sm text-brand-primary hover:underline"
                >
                  Esqueceu sua senha?
                </button>
              )}
            </div>

            {mode === 'signup' && (<div>
              <label className="block text-sm font-bold text-brand-text mb-2">E-mail *</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }} 
                placeholder="Para receber seus comprovantes" 
                className={`w-full p-3 bg-brand-surface border rounded-xl outline-none ${emailError ? 'border-red-500 focus:border-red-500' : 'border-brand-muted/20 focus:border-brand-primary'}`} 
                required 
              />
              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            </div>)}


            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full p-4 bg-brand-primary text-white rounded-xl text-base font-bold transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Processando...' : (mode === 'signup' ? 'Criar minha conta' : 'Entrar na conta')}
            </button>
          </form>
        )}

        {(mode === 'login' || mode === 'signup') && (
          <div className="mt-6 space-y-3">
            <div className="relative flex items-center justify-center">
              <span className="absolute bg-brand-card px-3 text-sm text-brand-muted">Ou</span>
              <div className="w-full border-t border-brand-muted/20"></div>
            </div>
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={loading || isSubmitting}
              className="w-full p-3 border border-brand-muted/20 rounded-xl flex items-center justify-center gap-2 text-brand-text hover:bg-brand-surface transition-colors disabled:opacity-50"
            >
              <img src="/google-icon.svg" alt="Google" className="h-5 w-5" />
              Continuar com Google
            </button>
            {/* Adicione outros provedores de login social aqui */}
          </div>
        )}

        {mode === 'forgot_password' && (
          <form className="space-y-5" onSubmit={handleForgotPassword}>
            <h2 className="text-2xl font-bold text-brand-text mb-4 text-center">Redefinir Senha</h2>
            <p className="text-brand-muted text-center mb-4">
              Informe seu e-mail para receber um link de redefinição de senha.
            </p>
            <div>
              <label className="block text-sm font-bold text-brand-text mb-2">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                placeholder="seu@email.com"
                className={`w-full p-3 bg-brand-surface border rounded-xl outline-none ${emailError ? 'border-red-500 focus:border-red-500' : 'border-brand-muted/20 focus:border-brand-primary'}`}
                required
              />
              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            </div>
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full p-4 bg-brand-primary text-white rounded-xl text-base font-bold transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Redefinir Senha'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setEmail(''); setEmailError(''); setPasswordError(''); setFullNameError(''); setPhoneError(''); }}
              className="w-full p-3 mt-2 text-sm text-brand-muted hover:underline"
            >
              Voltar para o Login
            </button>
          </form>
        )}
        {error && <div className="p-3 bg-red-500/10 text-red-600 border border-red-500/20 rounded-xl text-sm text-center">{error}</div>}
      </div>
    </div>
  );
};

export default Login;
