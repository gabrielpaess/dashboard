import React from 'react';
import { motion } from 'framer-motion';
import { Package, Wrench, BarChart3, Users, Truck, Receipt } from 'lucide-react';

const ProductionBreakdown = ({ data, detailed = false }) => {
  // Debug: verificar dados recebidos
  console.log('🔍 ProductionBreakdown - Dados recebidos:', {
    data,
    demand: data?.demand,
    wipTotalPedidos: data?.wip?.totalPedidos,
    capacity: data?.capacity,
    itemsInProduction: data?.itemsInProduction,
    preparandoEnvio: data?.preparandoEnvio,
    faturado: data?.faturado
  });

  // Validação de dados para evitar erros
  if (!data) {
    return (
      <div className="text-center text-gray-500 p-4">
        <p>Carregando dados de produção...</p>
      </div>
    );
  }

  const { 
    itemsInProduction = 0, 
    wipByStage = {}, 
    capacity = 0, 
    demand = 0, 
    preparandoEnvio = 0, 
    faturado = 0,
    wip = {}
  } = data;
  
  // Usar totalPedidos do wip se demand for 0
  const pedidosDaSemana = demand > 0 ? demand : (wip.totalPedidos || 0);
  
  // Debug: mostrar valor final
  console.log('📊 ProductionBreakdown - Valor final:', {
    demand,
    wipTotalPedidos: wip.totalPedidos,
    pedidosDaSemana,
    usandoWip: demand === 0
  });

  
  const totalItems = Object.values(wipByStage).reduce((a, b) => a + (b || 0), 0);

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
    { name: 'Em Desenvolvimento', count: wipByStage['Em Desenvolvimento'] || 0, icon: <Wrench className="text-orange-400" />, color: 'orange' },
    { name: 'Em Produção', count: wipByStage['Em Produção'] || 0, icon: <Package className="text-yellow-400" />, color: 'yellow' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-effect rounded-xl p-6 h-full flex flex-col max-h-[750px] overflow-hidden"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-purple-400" />
          Visão de Produção
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1} className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-blue-500/30">
          <h3 className="text-sm font-medium text-blue-300 mb-2 flex items-center"><Users className="w-4 h-4 mr-2"/>Pedidos da Semana</h3>
          <p className="text-3xl font-bold text-white">{pedidosDaSemana}</p>
          <p className="text-xs text-gray-400">/ {capacity} de capacidade</p>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2} className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
          <h3 className="text-sm font-medium text-yellow-300 mb-2 flex items-center"><Package className="w-4 h-4 mr-2"/>Itens em Produção</h3>
          <p className="text-3xl font-bold text-white">{itemsInProduction}</p>
          <p className="text-xs text-gray-400">Preparando envio e Faturado</p>
          {data.wipCalculationMethod && (
            <p className="text-xs text-yellow-200 mt-1">
              {data.wipCalculationMethod === 'warehouse' ? '🏪 Data Warehouse' : 
               data.wipCalculationMethod === 'api' ? '📊 API Real' : 
               data.wipCalculationMethod === 'real' ? '📊 Quantidade real' : '📋 Contagem de pedidos'}
            </p>
          )}
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

      <h3 className="text-lg font-semibold text-white mb-4">Itens por Estágio</h3>
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 flex-grow overflow-y-auto">
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