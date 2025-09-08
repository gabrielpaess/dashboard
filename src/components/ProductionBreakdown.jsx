import React from 'react';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Wrench, BarChart3, Users, GitBranch, Send, CheckCircle, Truck, Receipt } from 'lucide-react';

const ProductionBreakdown = ({ data, detailed = false }) => {
  const { itemsSold, itemsInProduction, itemsProduced, wipByStage, capacity, demand, preparandoEnvio, faturado } = data;
  const totalItems = Object.values(wipByStage).reduce((a, b) => a + b, 0);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5
      }
    })
  };

  const stages = [
    { name: 'Vendido', count: wipByStage['Vendido'] || 0, icon: <ShoppingCart className="text-blue-400" />, color: 'blue' },
    { name: 'Em Desenvolvimento', count: wipByStage['Em Desenvolvimento'] || 0, icon: <Wrench className="text-orange-400" />, color: 'orange' },
    { name: 'Em Produção', count: wipByStage['Em Produção'] || 0, icon: <Package className="text-yellow-400" />, color: 'yellow' },
    { name: 'Preparando Envio', count: wipByStage['Preparando Envio'] || 0, icon: <Package className="text-yellow-400" />, color: 'yellow' },
    { name: 'Faturado', count: wipByStage['Faturado'] || 0, icon: <Package className="text-green-400" />, color: 'green' },
    { name: 'Enviado', count: wipByStage['Enviado'] || 0, icon: <Send className="text-indigo-400" />, color: 'indigo' },
    { name: 'Entregue', count: wipByStage['Entregue'] || 0, icon: <CheckCircle className="text-teal-400" />, color: 'teal' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-effect rounded-xl p-6 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-purple-400" />
          Visão de Produção
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1} className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-blue-500/30">
          <h3 className="text-sm font-medium text-blue-300 mb-2 flex items-center"><Users className="w-4 h-4 mr-2"/>Carga da Semana</h3>
          <p className="text-3xl font-bold text-white">{demand}</p>
          <p className="text-xs text-gray-400">/ {capacity} de capacidade</p>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2} className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
          <h3 className="text-sm font-medium text-yellow-300 mb-2 flex items-center"><Package className="w-4 h-4 mr-2"/>WIP Total</h3>
          <p className="text-3xl font-bold text-white">{itemsInProduction}</p>
          <p className="text-xs text-gray-400">Itens em produção</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-orange-500/20 rounded-lg p-4 border border-orange-500/30 text-center">
          <Truck className="w-8 h-8 mx-auto mb-2 text-orange-300" />
          <p className="text-3xl font-bold text-white">{preparandoEnvio || 0}</p>
          <p className="text-sm text-orange-300">Preparando Envio</p>
        </div>
        <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30 text-center">
          <Receipt className="w-8 h-8 mx-auto mb-2 text-green-300" />
          <p className="text-3xl font-bold text-white">{faturado || 0}</p>
          <p className="text-sm text-green-300">Faturado</p>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-4">Itens por Estágio (Kanban)</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-grow">
        {stages.map((stage, i) => (
          <motion.div
            key={stage.name}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={i + 2}
            className={`bg-${stage.color}-500/10 rounded-lg p-4 border border-${stage.color}-500/20 flex flex-col items-center justify-center text-center`}
          >
            <div className={`w-12 h-12 rounded-full bg-${stage.color}-500/20 flex items-center justify-center mb-3`}>
              {React.cloneElement(stage.icon, { className: `w-6 h-6 text-${stage.color}-400` })}
            </div>
            <p className="text-2xl font-bold text-white">{stage.count}</p>
            <p className="text-sm font-medium text-gray-300">{stage.name}</p>
            <p className="text-xs text-gray-400 mt-1">Tempo médio: ~{i+1}.5 dias</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ProductionBreakdown;