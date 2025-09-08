import React from 'react';
import SalesMetrics from '@/components/SalesMetrics';
import SalesGoals from '@/components/SalesGoals';
import { motion } from 'framer-motion';

const SalesView = ({ data }) => {
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <SalesGoals data={data.salesMetrics} />
      <SalesMetrics data={data.salesMetrics} />
    </motion.div>
  );
};

export default SalesView;