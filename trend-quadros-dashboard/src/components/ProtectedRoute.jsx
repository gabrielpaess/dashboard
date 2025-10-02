import React from 'react';
import { motion } from 'framer-motion';
import { Lock, AlertTriangle } from 'lucide-react';

const ProtectedRoute = ({ children, requiredLevel, fallback = null, user, isAuthenticated }) => {
  const userLevel = user?.nivel;

  // Debug logs
  console.log('🔍 ProtectedRoute - Verificando acesso:', {
    isAuthenticated,
    user,
    userLevel,
    requiredLevel
  });

  // Se não estiver autenticado, não renderizar nada
  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute - Usuário não autenticado');
    return null;
  }

  // Se não tiver nível específico requerido, renderizar normalmente
  if (!requiredLevel) {
    console.log('✅ ProtectedRoute - Sem nível requerido, permitindo acesso');
    return children;
  }

  // Função para verificar acesso baseada no nível do usuário
  const hasAccessToTab = (tabLevel) => {
    if (!userLevel) {
      console.log('❌ hasAccessToTab - Sem userLevel');
      return false;
    }

    // Admin tem acesso a tudo
    if (userLevel === 'admin') {
      console.log('✅ hasAccessToTab - Admin tem acesso a tudo');
      return true;
    }

    // Mapear níveis de usuário para abas
    const levelToTabMap = {
      'vendas': 'sales',
      'desenvolvimento': 'development', 
      'producao': 'production',
      'admin': 'overview'
    };

    const userTab = levelToTabMap[userLevel];
    const hasAccess = userTab === tabLevel;
    
    console.log('🔍 hasAccessToTab - Verificação:', {
      userLevel,
      userTab,
      requiredTab: tabLevel,
      hasAccess
    });

    return hasAccess;
  };

  // Função para obter nome do nível do usuário
  const getUserLevelDisplayName = () => {
    if (!userLevel) {
      return 'Nenhum';
    }

    const levelNames = {
      'admin': 'Administrador',
      'vendas': 'Vendas',
      'desenvolvimento': 'Desenvolvimento',
      'producao': 'Produção'
    };

    return levelNames[userLevel] || userLevel;
  };

  // Verificar se o usuário tem acesso ao nível requerido
  const hasAccess = hasAccessToTab(requiredLevel);
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
          Seu nível de acesso atual: <strong>{getUserLevelDisplayName()}</strong>
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
