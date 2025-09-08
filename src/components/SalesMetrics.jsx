import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const SalesMetrics = ({ data, detailed = false }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateProgress = (current, goal) => {
    return Math.min((current / goal) * 100, 100);
  };

  const calculateGrowth = (current, previous) => {
    return ((current - previous) / previous) * 100;
  };

  const handleDetailedView = () => {
    toast({
      title: "🚧 Funcionalidade em desenvolvimento",
      description: "Esta funcionalidade ainda não foi implementada—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀"
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-effect rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-green-400" />
          Métricas de Vendas
        </h2>
        {!detailed && (
          <Button variant="outline" size="sm" onClick={handleDetailedView} className="text-white border-white/20">
            Ver Detalhes
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Vendas Diárias */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-blue-400">Vendas Hoje</h3>
            <div className="flex items-center text-sm">
              {calculateGrowth(data.daily.current, data.daily.previous) > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
              )}
              <span className={calculateGrowth(data.daily.current, data.daily.previous) > 0 ? 'text-green-400' : 'text-red-400'}>
                {Math.abs(calculateGrowth(data.daily.current, data.daily.previous)).toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl font-bold text-white">{formatCurrency(data.daily.current)}</span>
            <span className="text-sm text-gray-400">Meta: {formatCurrency(data.daily.goal)}</span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${calculateProgress(data.daily.current, data.daily.goal)}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {calculateProgress(data.daily.current, data.daily.goal).toFixed(1)}% da meta diária
          </p>
        </div>

        {/* Vendas Semanais */}
        <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-lg p-4 border border-green-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-green-400">Vendas Semana</h3>
            <div className="flex items-center text-sm">
              {calculateGrowth(data.weekly.current, data.weekly.previous) > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
              )}
              <span className={calculateGrowth(data.weekly.current, data.weekly.previous) > 0 ? 'text-green-400' : 'text-red-400'}>
                {Math.abs(calculateGrowth(data.weekly.current, data.weekly.previous)).toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl font-bold text-white">{formatCurrency(data.weekly.current)}</span>
            <span className="text-sm text-gray-400">Meta: {formatCurrency(data.weekly.goal)}</span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${calculateProgress(data.weekly.current, data.weekly.goal)}%` }}
              transition={{ duration: 1, delay: 0.4 }}
              className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {calculateProgress(data.weekly.current, data.weekly.goal).toFixed(1)}% da meta semanal
          </p>
        </div>

        {/* Vendas Mensais */}
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-orange-400">Vendas Mês</h3>
            <div className="flex items-center text-sm">
              {calculateGrowth(data.monthly.current, data.monthly.previous) > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
              )}
              <span className={calculateGrowth(data.monthly.current, data.monthly.previous) > 0 ? 'text-green-400' : 'text-red-400'}>
                {Math.abs(calculateGrowth(data.monthly.current, data.monthly.previous)).toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl font-bold text-white">{formatCurrency(data.monthly.current)}</span>
            <span className="text-sm text-gray-400">Meta: {formatCurrency(data.monthly.goal)}</span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${calculateProgress(data.monthly.current, data.monthly.goal)}%` }}
              transition={{ duration: 1, delay: 0.6 }}
              className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {calculateProgress(data.monthly.current, data.monthly.goal).toFixed(1)}% da meta mensal
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SalesMetrics;