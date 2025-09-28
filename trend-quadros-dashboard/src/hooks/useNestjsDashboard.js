import { useState, useEffect, useCallback } from 'react';
import { nestjsDashboardService } from '../services';

export const useNestjsDashboard = (filters = {}) => {
  const [data, setData] = useState({
    overview: null,
    sales: null,
    production: null,
    afterSales: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchData = useCallback(async (newFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const [overviewRes, salesRes, productionRes, afterSalesRes] = await Promise.all([
        nestjsDashboardService.getOverviewData(newFilters),
        nestjsDashboardService.getSalesData(newFilters),
        nestjsDashboardService.getProductionData(newFilters),
        nestjsDashboardService.getAfterSalesData(newFilters)
      ]);

      const newData = {
        overview: overviewRes.success ? overviewRes.data : null,
        sales: salesRes.success ? salesRes.data : null,
        production: productionRes.success ? productionRes.data : null,
        afterSales: afterSalesRes.success ? afterSalesRes.data : null
      };

      setData(newData);
      setLastFetched(new Date());
      
      // Verificar se houve algum erro
      const errors = [overviewRes, salesRes, productionRes, afterSalesRes]
        .filter(res => !res.success)
        .map(res => res.error);
      
      if (errors.length > 0) {
        setError(errors.join('; '));
      }
      
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [fetchData, JSON.stringify(filters)]);

  const refetch = useCallback((newFilters = {}) => {
    return fetchData(newFilters);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastFetched,
    refetch
  };
};
