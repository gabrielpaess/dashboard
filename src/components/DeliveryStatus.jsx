
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Clock, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Package, Wrench, Send, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DeliveryStatus = ({ orders, detailed = false }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [showAllOrders, setShowAllOrders] = useState(false);
  
  // Filtrar pedidos cancelados
  const activeOrders = orders.filter(order => order.situacao !== 'Cancelado');
  
  // Determinar quantos pedidos mostrar
  const ordersToShow = showAllOrders ? activeOrders : activeOrders.slice(0, 5);

  const getStatusInfo = (status, willBeLate, deliveryDate) => {
    if (deliveryDate) {
      return { icon: <CheckCircle className="w-4 h-4 text-purple-400" />, text: 'Entregue', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    }
    switch (status) {
      case 'on-time':
        return { icon: <CheckCircle className="w-4 h-4 text-green-400" />, text: 'No Prazo', className: 'status-on-time' };
      case 'risk':
        return { icon: <Clock className="w-4 h-4 text-yellow-400" />, text: willBeLate ? 'Vai Atrasar' : 'Em Risco', className: 'status-risk' };
      case 'late':
        return { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, text: 'Atrasado', className: 'status-late' };
      case 'delivered':
        return { icon: <CheckCircle className="w-4 h-4 text-purple-400" />, text: 'Entregue', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'cancelled':
        return { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, text: 'Cancelado', className: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case 'shipped':
        return { icon: <Send className="w-4 h-4 text-indigo-400" />, text: 'Enviado', className: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
      case 'invoiced':
        return { icon: <Package className="w-4 h-4 text-green-400" />, text: 'Faturado', className: 'bg-green-500/20 text-green-400 border-green-500/30' };
      default:
        // Fallback para status não mapeados - usar lógica baseada em dias restantes
        console.warn('⚠️ Status não mapeado encontrado:', status);
        return { icon: <Truck className="w-4 h-4 text-gray-400" />, text: 'Processando', className: 'bg-gray-500/20' };
    }
  };

  const getItemStageIcon = (stage) => {
    const stages = {
      // Estágios da interface
      'Vendido': <ShoppingCart className="w-4 h-4 text-blue-400" />,
      'Em Produção': <Package className="w-4 h-4 text-yellow-400" />,
      'Em Desenvolvimento': <Wrench className="w-4 h-4 text-orange-400" />,
      
      // Situações da API do Tiny
      'Em aberto': <ShoppingCart className="w-4 h-4 text-blue-400" />,
      'Preparando envio': <Package className="w-4 h-4 text-yellow-400" />,
      'Pronto para envio': <Package className="w-4 h-4 text-yellow-400" />,
      'Faturado': <Package className="w-4 h-4 text-green-400" />,
      'Enviado': <Send className="w-4 h-4 text-indigo-400" />,
      'Entregue': <CheckCircle className="w-4 h-4 text-purple-400" />,
      'Cancelado': <AlertTriangle className="w-4 h-4 text-red-400" />,
      
      // Estágios antigos para compatibilidade
      'Aprovar Arte': <Wrench className="w-4 h-4 text-pink-400" />,
      'Ajustar Arquivos': <Wrench className="w-4 h-4 text-purple-400" />,
      'Produzido': <Package className="w-4 h-4 text-green-400" />,
      'Expedido': <Send className="w-4 h-4 text-indigo-400" />,
    };
    return stages[stage] || <Package className="w-4 h-4 text-gray-400" />;
  };

  const statusCounts = orders.reduce((acc, order) => {
    const key = order.deliveryDate ? 'delivered' : order.status;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  
  // Calcular métricas de SLA apenas para pedidos ativos
  const activeStatusCounts = activeOrders.reduce((acc, order) => {
    const key = order.deliveryDate ? 'delivered' : order.status;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  
  const slaMetrics = {
    total: activeOrders.length,
    onTime: activeStatusCounts['on-time'] || 0,
    atRisk: activeStatusCounts['risk'] || 0,
    late: activeStatusCounts['late'] || 0,
    delivered: activeStatusCounts['delivered'] || 0,
    onTimePercentage: activeOrders.length > 0 ? Math.round(((activeStatusCounts['on-time'] || 0) / activeOrders.length) * 100) : 0
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-effect rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Truck className="w-6 h-6 mr-2 text-blue-400" />
          Status de Entrega (SLA)
        </h2>
        <div className="text-right">
          <p className="text-sm text-gray-400">Taxa de Cumprimento</p>
          <p className="text-2xl font-bold text-green-400">{slaMetrics.onTimePercentage}%</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="status-on-time rounded-lg p-3 text-center border">
          <CheckCircle className="w-6 h-6 mx-auto mb-2" />
          <p className="text-lg font-bold">{activeStatusCounts['on-time'] || 0}</p>
          <p className="text-xs">No Prazo</p>
        </div>
        <div className="status-risk rounded-lg p-3 text-center border">
          <Clock className="w-6 h-6 mx-auto mb-2" />
          <p className="text-lg font-bold">{activeStatusCounts['risk'] || 0}</p>
          <p className="text-xs">Em Risco</p>
        </div>
        <div className="status-late rounded-lg p-3 text-center border">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
          <p className="text-lg font-bold">{activeStatusCounts['late'] || 0}</p>
          <p className="text-xs">Atrasados</p>
        </div>
        <div className="bg-purple-500/20 text-purple-400 border-purple-500/30 rounded-lg p-3 text-center border">
          <CheckCircle className="w-6 h-6 mx-auto mb-2" />
          <p className="text-lg font-bold">{activeStatusCounts['delivered'] || 0}</p>
          <p className="text-xs">Entregues</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Acompanhamento de Pedidos</h3>
          <div className="text-sm text-gray-400">
            {activeOrders.length} pedidos ativos
          </div>
        </div>
        {ordersToShow.map((order, index) => {
          const { icon, text, className } = getStatusInfo(order.status, order.willBeLate, order.deliveryDate);
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`p-3 rounded-lg border ${className}`}
            >
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                <div className="flex items-center space-x-3">
                  {icon}
                  <div>
                    <p className="font-medium text-white">{order.order_id}</p>
                    <p className="text-sm text-gray-300">{order.customer}</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium">{text}</p>
                  {order.willBeLate && <p className="text-xs text-yellow-300 animate-pulse">Previsão de Atraso</p>}
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-400">{order.deliveryDate ? 'Entregue em' : 'Prometido'}</p>
                  <p className="text-sm font-medium text-white">{format(order.deliveryDate || order.promisedDate, 'dd/MM/yyyy')}</p>
                </div>
                
                {!order.deliveryDate && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Dias Restantes</p>
                    <p className={`text-sm font-medium ${order.diasRestantes < 0 ? 'text-red-400' : order.diasRestantes <= 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {order.diasRestantes < 0 ? `${Math.abs(order.diasRestantes)} atrasado` : `${order.diasRestantes} dias`}
                    </p>
                  </div>
                )}

                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  {expandedOrder === order.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </Button>
              </div>
              <AnimatePresence>
                {expandedOrder === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: '12px' }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-black/20 rounded-md p-3 space-y-2">
                       <h4 className="text-sm font-semibold text-white">Itens do Pedido</h4>
                       {order.riskReason && <p className="text-xs text-yellow-300"><AlertTriangle className="inline w-3 h-3 mr-1" />Justificativa do risco: {order.riskReason}</p>}
                       {order.items.map(item => (
                         <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded bg-white/5">
                           <div className="flex items-center gap-2">
                             {getItemStageIcon(item.stage)}
                             <span>{item.sku} - {item.title}</span>
                           </div>
                           <span className="font-semibold">{item.stage}</span>
                           <span>ETA: {format(new Date(item.stage_eta_at), 'dd/MM')}</span>
                         </div>
                       ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        
        {/* Botão para ver todos os pedidos */}
        {activeOrders.length > 5 && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllOrders(!showAllOrders)}
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              {showAllOrders ? (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Ver Menos
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Ver Todos ({activeOrders.length} pedidos)
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DeliveryStatus;
