import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, Wrench } from 'lucide-react';
import DeliveryStatus from '@/components/DeliveryStatus';
import AfterSalesAlerts from '@/components/AfterSalesAlerts';
const OverviewView = ({
  data
}) => {
  const {
    productionData,
    orders
  } = data;
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: i => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5
      }
    })
  };
  const wip = productionData.wipByStage || {};
  return <motion.div className="space-y-6" initial={{
    opacity: 0,
    y: 10
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5
  }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1} className="glass-effect rounded-xl p-6 text-center">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-blue-400" />
          <h3 className="text-lg font-semibold text-blue-400">Itens Vendidos</h3>
          <p className="text-4xl font-bold text-white mt-2">{wip['Vendido'] || 0}</p>
          <p className="text-sm text-gray-400">Aguardando produção</p>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={3} className="glass-effect rounded-xl p-6 text-center">
          <Wrench className="w-10 h-10 mx-auto mb-3 text-orange-400" />
          <h3 className="text-lg font-semibold text-orange-400">Em Desenvolvimento</h3>
          <p className="text-4xl font-bold text-white mt-2">{wip['Em Desenvolvimento'] || 0}</p>
          <p className="text-sm text-gray-400">Itens personalizados</p>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2} className="glass-effect rounded-xl p-6 text-center">
          <Package className="w-10 h-10 mx-auto mb-3 text-yellow-400" />
          <h3 className="text-lg font-semibold text-yellow-400">Em Produção</h3>
          <p className="text-4xl font-bold text-white mt-2">{wip['Em Produção'] || 0}</p>
          <p className="text-sm text-gray-400">Na linha de montagem</p>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DeliveryStatus orders={orders} />
        </div>
        <div>
          <AfterSalesAlerts orders={orders} />
        </div>
      </div>
    </motion.div>;
};
export default OverviewView;