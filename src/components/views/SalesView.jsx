import React from 'react';
import SalesMetrics from '@/components/SalesMetrics';
import SalesGoals from '@/components/SalesGoals';
import VendasPorVendedor from '@/components/VendasPorVendedor';
import { motion } from 'framer-motion';

const SalesView = ({ data, dateFilter }) => {
  // Validação de dados para evitar erros
  if (!data) {
    return (
      <div className="text-center text-gray-500 p-8">
        <p>Carregando dados de vendas...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Metas de Vendas - Largura completa */}
      <SalesGoals data={data.salesMetrics} />
      
      {/* Layout de duas colunas: Métricas à esquerda, Vendas por Vendedor à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesMetrics data={data.salesMetrics} />
        <VendasPorVendedor dateFilter={dateFilter} />
      </div>
    </motion.div>
  );
};

export default SalesView;