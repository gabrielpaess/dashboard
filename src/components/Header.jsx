import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Target, Truck, Package, Clock, RefreshCw } from 'lucide-react';

const Header = ({ lastUpdated, onRefresh, refreshing }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-effect rounded-lg p-5 sm:p-6 w-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold gradient-text">
              Dashboard Ponto Quadros
            </h1>
            <p className="text-gray-400 text-sm">
              Gestão em tempo real
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <div className="flex items-center space-x-2 bg-blue-500/20 px-4 py-2 rounded-md border border-blue-500/30">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">
                {lastUpdated.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-gray-400">
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