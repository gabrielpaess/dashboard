import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const SalesMetrics = ({ data, detailed = false }) => {
  // Validação de dados para evitar erros
  if (!data || !data.daily || !data.weekly || !data.monthly) {
    return (
      <div className="text-center text-gray-500 p-4">
        <p>Carregando métricas de vendas...</p>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const calculateProgress = (current, goal) => {
    if (!current || !goal) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const calculateGrowth = (current, previous) => {
    if (!current || !previous) return 0;
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
      className="glass-effect rounded-xl p-4 sm:p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
          <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-green-400" />
          <span className="hidden sm:inline">Métricas de Vendas</span>
          <span className="sm:hidden">Vendas</span>
        </h2>
        {!detailed && (
          <Button variant="outline" size="sm" onClick={handleDetailedView} className="text-white border-white/20">
            Ver Detalhes
          </Button>
        )}
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Vendas Diárias */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-blue-400">Vendas Hoje</h3>
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
          
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-2 space-y-1 sm:space-y-0">
            <span className="text-xl sm:text-2xl font-bold text-white">{formatCurrency(data.daily.current)}</span>
            <span className="text-xs sm:text-sm text-gray-400">Meta: {formatCurrency(data.daily.goal)}</span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${calculateProgress(data.daily.current, data.daily.goal)}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-400">
              {calculateProgress(data.daily.current, data.daily.goal).toFixed(1)}% da meta diária
            </p>
            <p className="text-xs text-blue-300">
              {data.daily.period || 'Hoje'}
            </p>
          </div>
        </div>

        {/* Vendas Semanais */}
        <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-lg p-4 border border-green-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-green-400">Vendas Semana</h3>
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
          
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-2 space-y-1 sm:space-y-0">
            <span className="text-xl sm:text-2xl font-bold text-white">{formatCurrency(data.weekly.current)}</span>
            <span className="text-xs sm:text-sm text-gray-400">Meta: {formatCurrency(data.weekly.goal)}</span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${calculateProgress(data.weekly.current, data.weekly.goal)}%` }}
              transition={{ duration: 1, delay: 0.4 }}
              className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full"
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-400">
              {calculateProgress(data.weekly.current, data.weekly.goal).toFixed(1)}% da meta semanal
            </p>
            <p className="text-xs text-green-300">
              {data.weekly.period || 'Esta semana'}
            </p>
          </div>
        </div>

        {/* Vendas Mensais */}
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-orange-400">Vendas Mês</h3>
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
          
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-2 space-y-1 sm:space-y-0">
            <span className="text-xl sm:text-2xl font-bold text-white">{formatCurrency(data.monthly.current)}</span>
            <span className="text-xs sm:text-sm text-gray-400">Meta: {formatCurrency(data.monthly.goal)}</span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${calculateProgress(data.monthly.current, data.monthly.goal)}%` }}
              transition={{ duration: 1, delay: 0.6 }}
              className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-400">
              {calculateProgress(data.monthly.current, data.monthly.goal).toFixed(1)}% da meta mensal
            </p>
            <p className="text-xs text-orange-300">
              {data.monthly.period || 'Este mês'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SalesMetrics;