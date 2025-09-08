import React from 'react';
import ProductionBreakdown from '@/components/ProductionBreakdown';
import DeliveryStatus from '@/components/DeliveryStatus';
import { motion } from 'framer-motion';

const ProductionView = ({ data }) => {
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductionBreakdown data={data.productionData} />
        <DeliveryStatus orders={data.orders} />
      </div>
    </motion.div>
  );
};

export default ProductionView;