import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { differenceInDays } from 'date-fns';
import { Bell, UserCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AfterSalesAlerts = ({ orders }) => {
  const { toast } = useToast();
  const now = new Date();

  const alerts = useMemo(() => {
    // Filtrar pedidos que têm data_prevista (promisedDate)
    const ordersWithPromisedDate = orders.filter(o => o.promisedDate);
    
    console.log('📦 Pós-venda - Pedidos com data_prevista:', {
      total: orders.length,
      comDataPrevista: ordersWithPromisedDate.length,
      exemplos: ordersWithPromisedDate.slice(0, 3).map(o => ({
        id: o.id,
        customer: o.customer,
        data_prevista: o.promisedDate,
        situacao: o.situacao
      }))
    });
    
    // Calcular data de pós-venda (data_prevista + 15 dias)
    const afterSalesAlerts = ordersWithPromisedDate.filter(o => {
      const promisedDate = new Date(o.promisedDate);
      const afterSalesDate = new Date(promisedDate.getTime() + 15 * 24 * 60 * 60 * 1000); // +15 dias
      const daysSinceAfterSales = differenceInDays(now, afterSalesDate);
      
      // Mostrar alerta se já passou da data de pós-venda (data_prevista + 15 dias)
      const shouldAlert = daysSinceAfterSales >= 0;
      
      if (shouldAlert) {
        console.log('🔔 ALERTA PÓS-VENDA:', {
          id: o.id,
          customer: o.customer,
          data_prevista: promisedDate.toISOString().split('T')[0],
          data_pos_venda: afterSalesDate.toISOString().split('T')[0],
          dias_desde_pos_venda: daysSinceAfterSales,
          situacao: o.situacao
        });
      }
      
      return shouldAlert;
    }).map(o => {
      const promisedDate = new Date(o.promisedDate);
      const afterSalesDate = new Date(promisedDate.getTime() + 15 * 24 * 60 * 60 * 1000);
      const daysSinceAfterSales = differenceInDays(now, afterSalesDate);
      
      return {
        ...o,
        type: 'pós-venda',
        afterSalesDate: afterSalesDate.toISOString().split('T')[0],
        daysSinceAfterSales,
        promisedDate: promisedDate.toISOString().split('T')[0]
      };
    });

    console.log('📊 RESULTADO ALERTAS PÓS-VENDA:', {
      totalAlertas: afterSalesAlerts.length,
      alertas: afterSalesAlerts.map(a => ({
        id: a.id,
        customer: a.customer,
        data_prevista: a.promisedDate,
        data_pos_venda: a.afterSalesDate,
        dias_desde_pos_venda: a.daysSinceAfterSales
      }))
    });

    return afterSalesAlerts.sort((a,b) => parseInt(a.id) - parseInt(b.id));
  }, [orders, now]);

  const handleContact = (customer) => {
    toast({
      title: "✅ Contato registrado",
      description: `Pós-venda com ${customer} marcado como concluído.`
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-effect rounded-xl p-6 h-full"
    >
      <h2 className="text-2xl font-bold text-white flex items-center mb-6">
        <Bell className="w-6 h-6 mr-2 text-cyan-400" />
        Alertas de Pós-venda
      </h2>

      {alerts.length > 0 ? (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-3 rounded-lg border flex items-center justify-between bg-cyan-500/20 border-cyan-500/30"
            >
              <div>
                <p className="font-medium text-white">{alert.customer}</p>
                <p className="text-xs text-gray-300">Pedido: {alert.order_id}</p>
                <p className="text-xs text-gray-400">Data prevista: {alert.promisedDate}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-cyan-300">
                  {alert.daysSinceAfterSales} DIAS
                </p>
                <p className="text-xs text-gray-400">pós-venda</p>
                <p className="text-xs text-gray-500">Data pós-venda: {alert.afterSalesDate}</p>
              </div>
              <button 
                onClick={() => handleContact(alert.customer)} 
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                title="Marcar como contatado"
              >
                <UserCheck className="w-5 h-5 text-green-400" />
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
          <Bell className="w-12 h-12 mb-4" />
          <p className="font-semibold">Nenhum alerta de pós-venda no momento.</p>
          <p className="text-sm">Aguardando data_prevista + 15 dias...</p>
        </div>
      )}
    </motion.div>
  );
};

export default AfterSalesAlerts;