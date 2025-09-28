import React from 'react';
import ProductionBreakdown from '../ProductionBreakdown';
import DeliveryStatus from '../DeliveryStatus';
import { motion } from 'framer-motion';

const ProductionView = ({ data }) => {
  // Validação de dados para evitar erros
  if (!data) {
    return (
      <div className="text-center text-gray-500 p-8">
        <p>Carregando dados de produção...</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductionBreakdown data={data.productionData || {}} />
        <DeliveryStatus orders={data.orders || []} />
      </div>
    </motion.div>
  );
};

export default ProductionView;