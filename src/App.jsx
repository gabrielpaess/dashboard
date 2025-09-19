import React, { useState, useEffect } from 'react';
// import { Helmet } from 'react-helmet'; // Removido temporariamente
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
        console.log('🔍 App - Iniciando verificação de autenticação...');
        
        const authenticated = authService.isLoggedIn();
        const currentUser = authService.getCurrentUser();
        
        console.log('🔍 App - Verificando autenticação:', { 
          authenticated, 
          currentUser,
          authServiceState: {
            isAuthenticated: authService.isAuthenticated,
            userLevel: authService.userLevel,
            currentUser: authService.currentUser
          }
        });
        
        setIsAuthenticated(authenticated);
        setUser(currentUser);
        setAuthChecked(true);
        
        console.log('✅ App - Estado de autenticação definido:', { authenticated, currentUser });
      } catch (error) {
        console.error('❌ App - Erro ao verificar autenticação:', error);
        console.error('❌ App - Stack trace:', error.stack);
        setIsAuthenticated(false);
        setUser(null);
        setAuthChecked(true);
      }
    };

    // Verificar autenticação após o loading inicial
    if (!isLoading) {
      console.log('🔍 App - Loading completo, verificando autenticação...');
      checkAuthentication();
    } else {
      console.log('⏳ App - Ainda carregando...');
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

  // Configurar título da página
  useEffect(() => {
    document.title = 'Dashboard - Ponto Quadros';
  }, []);

  return (
    <>
      
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