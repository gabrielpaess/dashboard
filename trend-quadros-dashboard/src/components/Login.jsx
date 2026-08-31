import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { nestjsApiClient } from '../services';
import { cn } from '../lib/utils';

const inputBaseClass =
  'h-11 w-full rounded-lg border border-white/15 !bg-slate-950/45 pl-11 text-[15px] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] placeholder:text-slate-400 focus-visible:border-blue-400/70 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 focus-visible:ring-offset-transparent disabled:opacity-50';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (error || success) {
      setError('');
      setSuccess('');
    }
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um email válido');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await nestjsApiClient.login(email, password);

      if (result.success) {
        setSuccess('Login realizado com sucesso! Redirecionando...');
        setTimeout(() => {
          onLoginSuccess(result.data.user);
        }, 1500);
      } else {
        let errorMessage = result.error || 'Erro desconhecido';

        if (errorMessage.includes('Email ou senha inválidos')) {
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
        } else if (errorMessage.includes('email must be an email')) {
          errorMessage = 'Por favor, insira um email válido.';
        } else if (errorMessage.includes('password must be longer')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
        } else if (errorMessage.includes('Erro de conectividade')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        }

        setError(errorMessage);
      }
    } catch (error) {
      let errorMessage = 'Erro interno do servidor';

      if (error.message.includes('Email ou senha inválidos')) {
        errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
      } else if (error.message.includes('email must be an email')) {
        errorMessage = 'Por favor, insira um email válido.';
      } else if (error.message.includes('password must be longer')) {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (error.message.includes('Erro de conectividade')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua internet.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0e14] px-4 py-10 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-[420px]"
      >
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Ponto Analytics
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300/90">
            Faça login para acessar o dashboard
          </p>
        </header>

        <div
          className={cn(
            'rounded-2xl border border-white/15 p-6 sm:p-8',
            'bg-white/[0.06] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl',
          )}
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2f80ed] to-[#56ccf2] shadow-lg shadow-blue-950/30">
              <User className="h-8 w-8 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-semibold text-white">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-400">Use suas credenciais corporativas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-200">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className={inputBaseClass}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-200">
                Senha
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className={cn(inputBaseClass, 'pr-11')}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  disabled={loading}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2.5 text-sm text-red-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/35 px-3 py-2.5 text-sm text-emerald-200"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-gradient-to-r from-[#2f80ed] to-[#56ccf2] text-base font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:from-blue-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <details className="group mt-6 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-left [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-slate-300 transition hover:text-white">
              <span>Níveis de acesso</span>
              <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
            </summary>
            <ul className="mt-3 space-y-2 border-t border-white/10 pt-3 text-xs leading-relaxed text-slate-400 sm:text-sm">
              <li className="flex gap-2">
                <span aria-hidden>👑</span>
                <span>
                  <strong className="text-slate-200">Admin</strong> — acesso completo
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>📈</span>
                <span>
                  <strong className="text-slate-200">Vendas</strong> — apenas aba Vendas
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>🛠️</span>
                <span>
                  <strong className="text-slate-200">Desenvolvimento</strong> — apenas aba Desenvolvimento
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>📦</span>
                <span>
                  <strong className="text-slate-200">Produção</strong> — apenas aba Produção
                </span>
              </li>
            </ul>
          </details>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
