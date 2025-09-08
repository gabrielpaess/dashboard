import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Target, Truck, Package, Clock, RefreshCw } from 'lucide-react';

const Header = ({ lastUpdated, onRefresh, refreshing }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-effect rounded-xl p-6 mb-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold gradient-text mb-2">
            Dashboard Ponto Quadros
          </h1>
          <p className="text-gray-300 text-lg">
            Gestão em tempo real
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-2 rounded-lg border border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">Online</span>
          </div>
          
          {lastUpdated && (
            <div className="flex items-center space-x-2 bg-blue-500/20 px-3 py-2 rounded-lg border border-blue-500/30">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">
                Atualizado: {lastUpdated.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          )}
          
          {onRefresh && (
            <button
              onClick={() => onRefresh(true)}
              disabled={refreshing}
              className="flex items-center space-x-2 bg-purple-500/20 px-3 py-2 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-purple-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-purple-400 text-sm font-medium">
                {refreshing ? 'Atualizando...' : 'Atualizar'}
              </span>
            </button>
          )}
          
          <div className="flex items-center space-x-1 text-gray-400">
            <BarChart3 className="w-5 h-5" />
            <Target className="w-5 h-5" />
            <Truck className="w-5 h-5" />
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Header;