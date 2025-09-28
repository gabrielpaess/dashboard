import React from 'react';
import { motion } from 'framer-motion';
import { Lock, AlertTriangle } from 'lucide-react';
import { authService } from '../services/authServiceSimple';

const ProtectedRoute = ({ children, requiredLevel, fallback = null, user, isAuthenticated }) => {
  // Usar props se disponíveis, senão usar authService como fallback
  let currentUser = user;
  let currentAuth = isAuthenticated;
  
  if (!currentUser || currentAuth === undefined) {
    // Forçar sincronização se não tiver props
    const syncResult = authService.forceSync();
    currentUser = currentUser || syncResult.user;
    currentAuth = currentAuth !== undefined ? currentAuth : syncResult.isAuthenticated;
  }
  
  const userLevel = currentUser?.nivel;

  // Debug logs
  console.log('🔍 ProtectedRoute - Verificando acesso:', {
    isAuthenticated: currentAuth,
    user: currentUser,
    userLevel,
    requiredLevel,
    hasAccess: authService.hasAccessToTab(requiredLevel)
  });

  // Log específico para aba sales
  if (requiredLevel === 'sales') {
    console.log('🔍 ProtectedRoute SALES - Detalhes:', {
      currentAuth,
      currentUser,
      userLevel,
      hasAccess: authService.hasAccessToTab(requiredLevel),
      authServiceUser: authService.getCurrentUser(),
      authServiceAuth: authService.isLoggedIn()
    });
  }

  // Se não estiver autenticado, não renderizar nada
  if (!currentAuth) {
    console.log('❌ ProtectedRoute - Usuário não autenticado');
    return null;
  }

  // Se não tiver nível específico requerido, renderizar normalmente
  if (!requiredLevel) {
    console.log('✅ ProtectedRoute - Sem nível requerido, permitindo acesso');
    return children;
  }

  // Verificar se o usuário tem acesso ao nível requerido
  const hasAccess = authService.hasAccessToTab(requiredLevel);
  console.log('🔍 ProtectedRoute - Verificação de acesso:', { hasAccess, userLevel, requiredLevel });

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center min-h-[400px] text-center p-8"
      >
        <div className="bg-red-500/20 border border-red-500/30 rounded-full p-6 mb-4">
          <Lock className="w-12 h-12 text-red-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">
          Acesso Negado
        </h2>
        
        <p className="text-gray-300 mb-4 max-w-md">
          Você não tem permissão para acessar esta seção. 
          Seu nível de acesso atual: <strong>{authService.getUserLevelDisplayName()}</strong>
        </p>

        <div className="flex items-center space-x-2 text-yellow-400 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">
            Entre em contato com o administrador para solicitar acesso
          </span>
        </div>
      </motion.div>
    );
  }

  console.log('✅ ProtectedRoute - Acesso permitido para:', { userLevel, requiredLevel });
  return children;
};

export default ProtectedRoute;
