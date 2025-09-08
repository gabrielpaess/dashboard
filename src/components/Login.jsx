import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Instagram, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const Login = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setLoading(false);
    }
  };

  const handleInstagramLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'instagram',
      options: {
        redirectTo: window.location.href,
      }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Não foi possível iniciar o login com o Instagram: " + error.message,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-slate-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-6 glass-effect rounded-xl shadow-lg"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white gradient-text">Ponto Quadros</h1>
          <p className="text-slate-300">Acesse seu dashboard de gestão</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-300">Email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-300">Senha</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? 'Entrando...' : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Entrar com Email
              </>
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-slate-800/50 px-2 text-slate-400 rounded-full">ou</span>
          </div>
        </div>

        <Button onClick={handleInstagramLogin} className="w-full bg-pink-500 hover:bg-pink-600/90 text-white">
          <Instagram className="w-4 h-4 mr-2" />
          Conectar com Instagram
        </Button>
      </motion.div>
    </div>
  );
};

export default Login;