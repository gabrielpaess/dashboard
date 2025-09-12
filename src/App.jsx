import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Dashboard from '@/components/Dashboard';
import LoadingScreen from '@/components/LoadingScreen';
import { Toaster } from '@/components/ui/toaster';
import { authService } from '@/services/authServiceSimple';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const authenticated = authService.isLoggedIn();
        const currentUser = authService.getCurrentUser();
        
        console.log('🔍 App - Verificando autenticação:', { authenticated, currentUser });
        
        setIsAuthenticated(authenticated);
        setUser(currentUser);
        setAuthChecked(true);
      } catch (error) {
        console.error('❌ App - Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
        setUser(null);
        setAuthChecked(true);
      }
    };

    // Verificar autenticação após o loading inicial
    if (!isLoading) {
      checkAuthentication();
    }
  }, [isLoading]);

  // Função para lidar com login bem-sucedido
  const handleLoginSuccess = (userData) => {
    console.log('✅ App - Login bem-sucedido:', userData);
    setUser(userData);
    setIsAuthenticated(true);
    
    // Forçar re-verificação da autenticação após um breve delay
    setTimeout(() => {
      const authenticated = authService.isLoggedIn();
      const currentUser = authService.getCurrentUser();
      
      if (authenticated && currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        console.log('✅ App - Estado de autenticação atualizado:', currentUser);
      }
    }, 1000);
  };

  // Função para lidar com logout
  const handleLogout = () => {
    console.log('🚪 App - Logout realizado');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - Ponto Quadros</title>
        <meta name="description" content="Dashboard para gestão de pedidos, integrado com a API do Tiny." />
        <meta property="og:title" content="Dashboard - Ponto Quadros" />
        <meta property="og:description" content="Dashboard para gestão de pedidos do e-commerce, integrado com a API do Tiny." />
        <meta property="og:image" content="/522184952_17844836835536970_1924575561701237564_n.jpg" />
        <link rel="icon" type="image/jpeg" href="/522184952_17844836835536970_1924575561701237564_n.jpg" />
        <link rel="apple-touch-icon" href="/522184952_17844836835536970_1924575561701237564_n.jpg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Helmet>
      
      {isLoading ? (
        <LoadingScreen onComplete={handleLoadingComplete} />
      ) : !authChecked ? (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="w-full h-full border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-white text-lg">Verificando autenticação...</p>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-slate-50">
          <Dashboard 
            isAuthenticated={isAuthenticated}
            user={user}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />
          <Toaster />
        </div>
      )}
    </>
  );
}

export default App;