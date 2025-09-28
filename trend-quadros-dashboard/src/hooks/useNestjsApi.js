/**
 * Hook personalizado para usar a API NestJS
 */

import { useState, useEffect, useCallback } from 'react';
import { nestjsDashboardService } from '../services';

export function useNestjsApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Carregar dados do dashboard
   */
  const loadDashboardData = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await nestjsDashboardService.getAllDashboardData(filters);
      
      if (response.success) {
        setData(response.data);
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carregar dados de overview
   */
  const loadOverview = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await nestjsDashboardService.getOverview(filters);
      
      if (response.success) {
        setData(prev => ({
          ...prev,
          overview: response.data
        }));
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Erro ao carregar overview');
      }
    } catch (err) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carregar dados de vendas
   */
  const loadSales = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await nestjsDashboardService.getSales(filters);
      
      if (response.success) {
        setData(prev => ({
          ...prev,
          sales: response.data
        }));
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Erro ao carregar dados de vendas');
      }
    } catch (err) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carregar dados de produção
   */
  const loadProduction = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await nestjsDashboardService.getProduction(filters);
      
      if (response.success) {
        setData(prev => ({
          ...prev,
          production: response.data
        }));
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Erro ao carregar dados de produção');
      }
    } catch (err) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carregar dados de pós-venda
   */
  const loadAfterSales = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await nestjsDashboardService.getAfterSales(filters);
      
      if (response.success) {
        setData(prev => ({
          ...prev,
          afterSales: response.data
        }));
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Erro ao carregar dados de pós-venda');
      }
    } catch (err) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Executar sincronização
   */
  const executeSync = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await nestjsDashboardService.executeSync();
      
      if (response.success) {
        // Recarregar dados após sincronização
        await loadDashboardData();
      } else {
        setError(response.error || 'Erro ao executar sincronização');
      }
    } catch (err) {
      setError(err.message || 'Erro inesperado na sincronização');
    } finally {
      setLoading(false);
    }
  }, [loadDashboardData]);

  /**
   * Obter status da sincronização
   */
  const getSyncStatus = useCallback(async () => {
    try {
      const response = await nestjsDashboardService.getSyncStatus();
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Erro ao obter status da sincronização:', err);
      return null;
    }
  }, []);

  /**
   * Verificar se a API está online
   */
  const checkApiStatus = useCallback(async () => {
    try {
      return await nestjsDashboardService.isOnline();
    } catch (err) {
      console.error('Erro ao verificar status da API:', err);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    data,
    lastUpdated,
    loadDashboardData,
    loadOverview,
    loadSales,
    loadProduction,
    loadAfterSales,
    executeSync,
    getSyncStatus,
    checkApiStatus
  };
}

export default useNestjsApi;
