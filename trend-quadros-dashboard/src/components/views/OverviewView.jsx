import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, Wrench } from 'lucide-react';
import DeliveryStatus from '../DeliveryStatus';
import AfterSalesAlerts from '../AfterSalesAlerts';
const OverviewView = ({
  data
}) => {
  // Validação de dados para evitar erros
  if (!data) {
    return (
      <div className="text-center text-gray-500 p-8">
        <p>Carregando visão geral...</p>
      </div>
    );
  }

  const {
    productionData = {},
    orders = []
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
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1} className="glass-effect rounded-xl p-6 text-center h-40 flex flex-col justify-center">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-blue-400" />
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Total de Vendas</h3>
          <p className="text-4xl font-bold text-white mb-1">{wip['Total Ativos'] || 0}</p>
          <p className="text-sm text-gray-400">Total de pedidos</p>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={3} className="glass-effect rounded-xl p-6 text-center h-40 flex flex-col justify-center">
          <Wrench className="w-10 h-10 mx-auto mb-3 text-orange-400" />
          <h3 className="text-lg font-semibold text-orange-400 mb-2">Em Desenvolvimento</h3>
          <p className="text-4xl font-bold text-white mb-1">{wip['Em Desenvolvimento'] || 0}</p>
          <p className="text-sm text-gray-400">Itens personalizados</p>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2} className="glass-effect rounded-xl p-6 text-center h-40 flex flex-col justify-center">
          <Package className="w-10 h-10 mx-auto mb-3 text-yellow-400" />
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Em Produção</h3>
          <p className="text-4xl font-bold text-white mb-1">{wip['Em Produção'] || 0}</p>
          <p className="text-sm text-gray-400">Itens em produção</p>
        </motion.div>
      </div>
      
      <div className="space-y-6">
        <DeliveryStatus orders={orders} />
        <AfterSalesAlerts orders={orders} />
      </div>
    </motion.div>;
};
export default OverviewView;