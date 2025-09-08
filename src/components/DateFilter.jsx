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

  // Debug: Log das datas recebidas
  console.log('📅 DateFilter - Estado atual:', {
    startDate,
    endDate,
    appliedStartDate,
    appliedEndDate,
    filterActive,
    startDateFormatted: startDate ? formatDateForAPI(startDate) : 'undefined',
    endDateFormatted: endDate ? formatDateForAPI(endDate) : 'undefined',
    appliedStartDateFormatted: appliedStartDate ? formatDateForAPI(appliedStartDate) : 'undefined',
    appliedEndDateFormatted: appliedEndDate ? formatDateForAPI(appliedEndDate) : 'undefined'
  });

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
      className="glass-effect rounded-lg p-4 mb-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Filtros de Data</h3>
        </div>
        
        {/* Botão para habilitar filtros */}
        {!showFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
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
              className="flex flex-col sm:flex-row gap-4 w-full md:w-auto"
            >
              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-1">Data Inicial</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-1">Data Final</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleApplyFilter}
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>{loading ? 'Aplicando...' : 'Aplicar Filtro'}</span>
                </button>
                
                <button
                  onClick={() => setShowFilters(false)}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                  title="Ocultar filtros"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>Ocultar</span>
                </button>
                
                {onClearFilter && (
                  <button
                    onClick={onClearFilter}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                    title="Voltar ao filtro padrão (últimos 7 dias)"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Padrão</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DateFilter;
