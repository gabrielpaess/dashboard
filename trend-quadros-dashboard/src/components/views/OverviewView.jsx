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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1}
          className="rounded-2xl border border-slate-700/60 bg-[#171c25] px-5 py-4 min-h-[118px] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400">Pedidos ativos</p>
              <h3 className="mt-1 text-sm font-semibold text-slate-200">Total de Vendas</h3>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
              <ShoppingCart className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-[28px] leading-none font-bold tracking-tight text-blue-400">{wip['Total Ativos'] || 0}</p>
            <span className="text-[10px] text-slate-500">Total de pedidos</span>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={3}
          className="rounded-2xl border border-slate-700/60 bg-[#171c25] px-5 py-4 min-h-[118px] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400">Fluxo operacional</p>
              <h3 className="mt-1 text-sm font-semibold text-slate-200">Em Desenvolvimento</h3>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
              <Wrench className="h-4 w-4 text-orange-400" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-[28px] leading-none font-bold tracking-tight text-orange-400">{wip['Em Desenvolvimento'] || 0}</p>
            <span className="text-[10px] text-slate-500">Itens personalizados</span>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2}
          className="rounded-2xl border border-slate-700/60 bg-[#171c25] px-5 py-4 min-h-[118px] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400">Produção atual</p>
              <h3 className="mt-1 text-sm font-semibold text-slate-200">Em Produção</h3>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/10">
              <Package className="h-4 w-4 text-yellow-400" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-[28px] leading-none font-bold tracking-tight text-yellow-400">{wip['Em Produção'] || 0}</p>
            <span className="text-[10px] text-slate-500">Itens em produção</span>
          </div>
        </motion.div>
      </div>
      
      <div className="space-y-6">
        <DeliveryStatus orders={orders} />
        <AfterSalesAlerts orders={orders} />
      </div>
    </motion.div>;
};
export default OverviewView;