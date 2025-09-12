import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Loader2, AlertCircle } from 'lucide-react';
import { formatDateToBR } from '@/lib/utils';
import { getAfterSalesAlerts } from '@/services/afterSalesService';

const AfterSalesAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAfterSalesAlerts();
  }, []);

  const loadAfterSalesAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const alertsData = await getAfterSalesAlerts();
      
      // Validação de dados
      if (!alertsData || !Array.isArray(alertsData)) {
        setAlerts([]);
        return;
      }
      
      // Filter alerts that need attention (envio_15 or envio_45 is false/null)
      const pendingAlerts = alertsData.filter(alert => 
        alert && (!alert.envio_15 || !alert.envio_45)
      );
      
      setAlerts(pendingAlerts);
    } catch (err) {
      console.error('Error loading after-sales alerts:', err);
      setError('Erro ao carregar alertas de pós-venda');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
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

      {loading ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
          <Loader2 className="w-8 h-8 mb-4 animate-spin" />
          <p className="font-semibold">Carregando alertas...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-400">
          <Bell className="w-12 h-12 mb-4" />
          <p className="font-semibold">Erro ao carregar alertas</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={loadAfterSalesAlerts}
            className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white text-sm"
          >
            Tentar novamente
          </button>
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-4 rounded-lg border bg-cyan-500/20 border-cyan-500/30 min-h-[100px]"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-white">{alert.customer}</p>
                  <p className="text-xs text-gray-300">Pedido: {alert.pedido_id}</p>
                  <p className="text-xs text-gray-400">Data prevista: {formatDateToBR(alert.promisedDate)}</p>
                  <div className="flex gap-4 mt-1">
                    <span className={`text-xs ${alert.envio_15 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {alert.envio_15 ? '✓ 15 dias' : '⏳ 15 dias'}
                    </span>
                    <span className={`text-xs ${alert.envio_45 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {alert.envio_45 ? '✓ 45 dias' : '⏳ 45 dias'}
                    </span>
                  </div>
                </div>
                <div className="text-center mr-4">
                  <p className="text-sm font-semibold text-cyan-300">
                    {alert.daysSinceAfterSales} dias
                  </p>
                  <p className="text-xs text-gray-400">pós-venda</p>
                </div>
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-center">
                <p className="text-xs text-yellow-300">
                  ⚠️ Ação necessária - Acesse "Pós-venda"
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
          <Bell className="w-12 h-12 mb-4" />
          <p className="font-semibold">Nenhum alerta pendente no momento.</p>
          <p className="text-sm">Todos os contatos de pós-venda estão em dia!</p>
        </div>
      )}
    </motion.div>
  );
};

export default AfterSalesAlerts;