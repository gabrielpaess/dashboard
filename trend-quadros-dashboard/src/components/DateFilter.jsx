import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Filter, X, Settings, ChevronDown, ChevronUp } from 'lucide-react';

const DateFilter = ({ startDate, endDate, appliedStartDate, appliedEndDate, filterActive, onStartDateChange, onEndDateChange, onApplyFilter, onClearFilter, loading }) => {
  const [showFilters, setShowFilters] = useState(false);
  const formatDateForAPI = (date) => {
    if (!date) return '';
    // Converter yyyy-mm-dd para dd/mm/yyyy sem usar Date()
    const [ano, mes, dia] = date.split('-');
    return `${dia}/${mes}/${ano}`;
  };


  const handleApplyFilter = () => {
    // Prevenir duplo clique
    if (loading) return;
    
    // Validar se as datas estão preenchidas
    if (!startDate || !endDate) {
      alert('Por favor, selecione ambas as datas (inicial e final)');
      return;
    }
    
    onApplyFilter();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-effect rounded-lg p-5 sm:p-6 w-full"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Filter className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Filtros de Data</h3>
            <p className="text-sm text-gray-400">Configure o período de análise</p>
          </div>
        </div>
        
        {/* Botão para habilitar filtros */}
        {!showFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl text-sm font-medium"
          >
            <Settings className="w-5 h-5" />
            <span>Habilitar Filtros</span>
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        )}
        
        {/* Filtros de data (condicionalmente visíveis) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full bg-black/20 rounded-lg p-4 border border-white/10"
            >
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                <div className="flex flex-col flex-1">
                  <label className="text-sm text-gray-300 mb-2 font-medium">Data Inicial</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={startDate || ''}
                      onChange={(e) => onStartDateChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col flex-1">
                  <label className="text-sm text-gray-300 mb-2 font-medium">Data Final</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={endDate || ''}
                      onChange={(e) => onEndDateChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleApplyFilter}
                    disabled={loading}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
                  >
                    <Filter className="w-4 h-4" />
                    <span>{loading ? 'Aplicando...' : 'Aplicar'}</span>
                  </button>
                  
                  <button
                    onClick={() => setShowFilters(false)}
                    disabled={loading}
                    className="px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm"
                    title="Ocultar filtros"
                  >
                    <ChevronUp className="w-4 h-4" />
                    <span>Ocultar</span>
                  </button>
                  
                  {onClearFilter && (
                    <button
                      onClick={onClearFilter}
                      disabled={loading}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm"
                      title="Voltar ao filtro padrão (últimos 7 dias)"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Padrão</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DateFilter;
