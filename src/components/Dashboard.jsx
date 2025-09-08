import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import OverviewView from '@/components/views/OverviewView';
import DevelopmentView from '@/components/views/DevelopmentView';
import SalesView from '@/components/views/SalesView';
import ProductionView from '@/components/views/ProductionView';
import AfterSalesView from '@/components/views/AfterSalesView';
import { Eye, Wrench, DollarSign, Package, Bell } from 'lucide-react';
import DateFilter from '@/components/DateFilter';
import { apiService } from '@/services/apiService';
import { orderService } from '@/services/orderService';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // Inicializar com datas padrão (últimos 7 dias)
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  };

  const getDefaultEndDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Inicializar com datas padrão aplicadas
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [filterActive, setFilterActive] = useState(true); // Ativo por padrão
  const [appliedStartDate, setAppliedStartDate] = useState(getDefaultStartDate());
  const [appliedEndDate, setAppliedEndDate] = useState(getDefaultEndDate());
  const { toast } = useToast();


  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    
    
    // Converter yyyy-mm-dd para dd/mm/yyyy sem usar Date()
    const [ano, mes, dia] = dateString.split('-');
    const result = `${dia}/${mes}/${ano}`;
    
    
    return result;
  };

  const fetchOrders = useCallback(async (isManualRefresh = false, useFilter = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {

      let response;
      
      // Se deve usar filtro e há datas aplicadas, usar as datas do filtro
      if (useFilter && appliedStartDate && appliedEndDate) {
        const dataInicial = apiService.formatDateForAPI(appliedStartDate);
        const dataFinal = apiService.formatDateForAPI(appliedEndDate);
        
        
        response = await apiService.fetchAllPages({
          dataInicial,
          dataFinal
        });
      } else {
        response = await apiService.fetchAllPages();
      }


      // Processar dados usando o service
      const processedData = orderService.processOrderData(response.pedidos);
      
      
      setDashboardData(processedData);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error);
      toast({
        variant: "destructive",
        title: "Erro ao buscar dados",
        description: `Falha na comunicação: ${error.message}.`,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast, appliedStartDate, appliedEndDate]);

  const handleStartDateChange = (date) => {
    setStartDate(date);
    // NÃO desativar o filtro automaticamente - apenas quando aplicar
    // O filtro só será desativado quando o usuário clicar em "Aplicar Filtro"
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    // NÃO desativar o filtro automaticamente - apenas quando aplicar
    // O filtro só será desativado quando o usuário clicar em "Aplicar Filtro"
  };

  const handleApplyFilter = () => {

    // Validar datas antes de aplicar
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Por favor, selecione ambas as datas (inicial e final).",
      });
      return;
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia atual

    if (startDateObj > endDateObj) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "A data inicial não pode ser maior que a data final.",
      });
      return;
    }

    if (startDateObj > today) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "A data inicial não pode ser no futuro.",
      });
      return;
    }

    // Salvar as datas aplicadas e ativar o filtro
    
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setFilterActive(true);
    
    
    
    // Buscar dados com filtro
    fetchOrders(true, true);
  };

  const handleClearFilter = () => {
    
    // Voltar ao filtro padrão (últimos 7 dias)
    const defaultStart = getDefaultStartDate();
    const defaultEnd = getDefaultEndDate();
    
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setAppliedStartDate(defaultStart);
    setAppliedEndDate(defaultEnd);
    setFilterActive(true);
    
    // Buscar dados com filtro padrão
    fetchOrders(true, true);
  };

  useEffect(() => {
    // Carregar dados iniciais com filtro padrão (últimos 7 dias)
    fetchOrders(false, true); // useFilter = true para usar filtro padrão
    
    // Atualizar dados a cada 5 minutos (300000ms) com filtro atual
    const interval = setInterval(() => {
      // Buscar dados com filtro atual (se ativo) ou sem filtro
      fetchOrders(false, filterActive);
    }, 300000);
    
    return () => clearInterval(interval);
  }, [fetchOrders, filterActive, appliedStartDate, appliedEndDate]);

  // useEffect separado para evitar re-renders desnecessários quando apenas startDate/endDate mudam
  useEffect(() => {
    // Este useEffect não deve fazer fetch - apenas log para debug
  }, [startDate, endDate]);

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="relative w-48 h-48">
          {/* Borda de carregamento circular */}
          <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
            {/* Círculo de fundo */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="2"
              fill="none"
            />
            {/* Círculo de progresso */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 283" }}
              animate={{ strokeDasharray: "283 283" }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            {/* Gradiente para a borda */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>

          {/* Imagem central */}
          <div className="absolute inset-4 rounded-full overflow-hidden bg-white shadow-lg">
            <img
              src="/522184952_17844836835536970_1924575561701237564_n.jpg"
              alt="Ponto Quadros"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Texto de carregamento */}
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-sm text-gray-400 font-medium">Carregando Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-screen-2xl mx-auto space-y-6"
      >
        <Header 
          lastUpdated={lastUpdated} 
          onRefresh={fetchOrders}
          refreshing={refreshing}
        />

        <DateFilter
          startDate={startDate}
          endDate={endDate}
          appliedStartDate={appliedStartDate}
          appliedEndDate={appliedEndDate}
          filterActive={filterActive}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onApplyFilter={handleApplyFilter}
          onClearFilter={handleClearFilter}
          loading={loading || refreshing}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 glass-effect p-1 h-auto">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-teal-600/50 data-[state=active]:text-white flex items-center gap-2"><Eye className="w-4 h-4"/>Visão Geral</TabsTrigger>
            <TabsTrigger value="sales" className="text-white data-[state=active]:bg-green-600/50 data-[state=active]:text-white flex items-center gap-2"><DollarSign className="w-4 h-4"/>Vendas</TabsTrigger>
            <TabsTrigger value="development" className="text-white data-[state=active]:bg-pink-600/50 data-[state=active]:text-white flex items-center gap-2"><Wrench className="w-4 h-4"/>Desenvolvimento</TabsTrigger>
            <TabsTrigger value="production" className="text-white data-[state=active]:bg-yellow-600/50 data-[state=active]:text-white flex items-center gap-2"><Package className="w-4 h-4"/>Produção</TabsTrigger>
            <TabsTrigger value="after-sales" className="text-white data-[state=active]:bg-cyan-600/50 data-[state=active]:text-white flex items-center gap-2"><Bell className="w-4 h-4"/>Pós-venda</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview"><OverviewView data={dashboardData} /></TabsContent>
            <TabsContent value="development"><DevelopmentView data={dashboardData} /></TabsContent>
            <TabsContent value="sales"><SalesView data={dashboardData} /></TabsContent>
            <TabsContent value="production"><ProductionView data={dashboardData} /></TabsContent>
            <TabsContent value="after-sales"><AfterSalesView orders={dashboardData.orders} /></TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Dashboard;