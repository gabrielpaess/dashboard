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
import Login from '@/components/Login';
import UserHeader from '@/components/UserHeader';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Eye, Wrench, DollarSign, Package, Bell } from 'lucide-react';
import DateFilter from '@/components/DateFilter';
import { apiService } from '@/services/apiService';
import { orderService } from '@/services/orderService';
import { authService } from '@/services/authServiceSimple';

const Dashboard = ({ 
  isAuthenticated: propIsAuthenticated, 
  user: propUser, 
  onLoginSuccess: propOnLoginSuccess, 
  onLogout: propOnLogout 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(propIsAuthenticated || false);
  const [user, setUser] = useState(propUser || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // Inicializar com datas padrão (últimos 7 dias)
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    // Usar data local para evitar problemas de fuso horário
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDefaultEndDate = () => {
    const date = new Date();
    // Usar data local para evitar problemas de fuso horário
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Inicializar com datas padrão aplicadas
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [filterActive, setFilterActive] = useState(true); // Ativo por padrão
  const [appliedStartDate, setAppliedStartDate] = useState(getDefaultStartDate());
  const [appliedEndDate, setAppliedEndDate] = useState(getDefaultEndDate());
  const { toast } = useToast();

  // Sincronizar com props do App
  useEffect(() => {
    console.log('🔄 Dashboard - useEffect props:', { propIsAuthenticated, propUser });
    
    if (propIsAuthenticated !== undefined) {
      setIsAuthenticated(propIsAuthenticated);
    }
    if (propUser !== undefined) {
      setUser(propUser);
    }
    setLoading(false);
  }, [propIsAuthenticated, propUser]);

  // Redirecionamento específico após login
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      const userLevel = user.nivel;
      let defaultTab = 'overview';
      
      // Definir aba padrão baseada no nível do usuário
      switch (userLevel) {
        case 'admin':
          defaultTab = 'overview';
          break;
        case 'vendas':
          defaultTab = 'sales';
          break;
        case 'desenvolvimento':
          defaultTab = 'development';
          break;
        case 'producao':
          defaultTab = 'production';
          break;
        default:
          defaultTab = 'overview';
      }
      
      console.log('🔄 Dashboard - Redirecionamento automático:', defaultTab, 'para usuário:', user.nome, 'nível:', userLevel);
      setActiveTab(defaultTab);
    }
  }, [isAuthenticated, user, loading]);

  // Verificar autenticação ao carregar (fallback se não vier do App)
  useEffect(() => {
    if (propIsAuthenticated === undefined) {
      const checkAuth = () => {
        try {
          const authenticated = authService.isLoggedIn();
          const currentUser = authService.getCurrentUser();
          
          console.log('🔍 Dashboard - Verificando autenticação:', { authenticated, currentUser });
          
          setIsAuthenticated(authenticated);
          setUser(currentUser);
          
          // Redirecionar para aba correta baseada no nível do usuário
          if (currentUser && authenticated) {
            const userLevel = currentUser.nivel;
            let defaultTab = 'overview';
            
            // Definir aba padrão baseada no nível do usuário
            switch (userLevel) {
              case 'admin':
                defaultTab = 'overview';
                break;
              case 'vendas':
                defaultTab = 'sales';
                break;
              case 'desenvolvimento':
                defaultTab = 'development';
                break;
              case 'producao':
                defaultTab = 'production';
                break;
              default:
                defaultTab = 'overview';
            }
            
            setActiveTab(defaultTab);
            
            console.log('🔄 Dashboard (fallback) - Redirecionando para aba:', defaultTab, 'para usuário:', currentUser.nome);
            
            // Mostrar toast de boas-vindas (com delay para evitar conflitos)
            // Temporariamente desabilitado para debug
            // setTimeout(() => {
            //   toast({
            //     title: "Bem-vindo!",
            //     description: `Olá, ${currentUser.nome}! Redirecionando para sua área de trabalho.`,
            //   });
            // }, 500);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('❌ Dashboard - Erro ao verificar autenticação:', error);
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
        }
      };

      // Adicionar um pequeno delay para evitar problemas de renderização
      const timer = setTimeout(checkAuth, 100);
      return () => clearTimeout(timer);
    }
  }, [propIsAuthenticated, toast]);

  // Função para lidar com login bem-sucedido
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setLoading(false);
    
    // Redirecionar para aba correta baseada no nível do usuário
    if (userData) {
      const userLevel = userData.nivel;
      let defaultTab = 'overview';
      
      // Definir aba padrão baseada no nível do usuário
      switch (userLevel) {
        case 'admin':
          defaultTab = 'overview';
          break;
        case 'vendas':
          defaultTab = 'sales';
          break;
        case 'desenvolvimento':
          defaultTab = 'development';
          break;
        case 'producao':
          defaultTab = 'production';
          break;
        default:
          defaultTab = 'overview';
      }
      
      setActiveTab(defaultTab);
      
      console.log('🔄 Dashboard (login) - Redirecionando para aba:', defaultTab, 'para usuário:', userData.nome);
      
      // Mostrar toast de boas-vindas (com delay para evitar conflitos)
      // Temporariamente desabilitado para debug
      // setTimeout(() => {
      //   toast({
      //     title: "Login realizado!",
      //     description: `Olá, ${userData.nome}! Redirecionando para sua área de trabalho.`,
      //   });
      // }, 500);
    }
    
    // Se tiver callback do App, usar ele
    if (propOnLoginSuccess) {
      propOnLoginSuccess(userData);
    }
  };

  // Função para lidar com logout
  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setActiveTab('overview');
    
    // Se tiver callback do App, usar ele
    if (propOnLogout) {
      propOnLogout();
    }
  };


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
      console.log('🔄 Fetching data from Supabase (centralized)...');

      // Usar apenas dados centralizados do Supabase
      const dateFilter = useFilter && appliedStartDate && appliedEndDate ? {
        startDate: appliedStartDate,
        endDate: appliedEndDate
      } : null;
      
      // Processar dados diretamente do Supabase (sem API)
      const processedData = await orderService.processOrderDataCentralized(dateFilter);
      
      
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
    
    // Atualizar dados a cada 15 minutos (900000ms) com filtro atual
    // Intervalo aumentado para evitar exceder limite da API Tiny
    const interval = setInterval(() => {
      // Buscar dados com filtro atual (se ativo) ou sem filtro
      fetchOrders(false, filterActive);
    }, 900000);
    
    return () => clearInterval(interval);
  }, [fetchOrders, filterActive, appliedStartDate, appliedEndDate]);

  // useEffect separado para evitar re-renders desnecessários quando apenas startDate/endDate mudam
  useEffect(() => {
    // Este useEffect não deve fazer fetch - apenas log para debug
  }, [startDate, endDate]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="w-full h-full border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-lg">
            {isAuthenticated ? 'Carregando dashboard...' : 'Verificando autenticação...'}
          </p>
        </div>
      </div>
    );
  }

  // Mostrar tela de login se não estiver autenticado
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Debug: Mostrar informações básicas
  console.log('🔍 Dashboard renderizando:', { 
    isAuthenticated, 
    user, 
    loading, 
    dashboardData, 
    activeTab,
    propIsAuthenticated,
    propUser 
  });

  if (!dashboardData) {
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
    <div className="min-h-screen p-2 sm:p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-screen-2xl mx-auto space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <Header 
            lastUpdated={lastUpdated} 
            onRefresh={fetchOrders}
            refreshing={refreshing}
          />
          <UserHeader onLogout={handleLogout} />
        </div>

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

        <Tabs value={activeTab} onValueChange={(newValue) => {
          console.log('🔄 Tabs onValueChange:', newValue);
          setActiveTab(newValue);
        }} className="w-full">
          {console.log('🔍 Renderizando abas - activeTab:', activeTab, 'user:', user?.nivel)}
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 glass-effect p-1 h-auto gap-1">
            {authService.hasAccessToTab('overview') && (
              <TabsTrigger value="overview" className="text-white data-[state=active]:bg-teal-600/50 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2"><Eye className="w-3 h-3 sm:w-4 sm:h-4"/><span className="hidden sm:inline">Visão Geral</span><span className="sm:hidden">Geral</span></TabsTrigger>
            )}
            {authService.hasAccessToTab('sales') && (
              <TabsTrigger value="sales" className="text-white data-[state=active]:bg-green-600/50 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2"><DollarSign className="w-3 h-3 sm:w-4 sm:h-4"/><span className="hidden sm:inline">Vendas</span><span className="sm:hidden">Vendas</span></TabsTrigger>
            )}
            {authService.hasAccessToTab('development') && (
              <TabsTrigger value="development" className="text-white data-[state=active]:bg-pink-600/50 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2"><Wrench className="w-3 h-3 sm:w-4 sm:h-4"/><span className="hidden sm:inline">Desenvolvimento</span><span className="sm:hidden">Dev</span></TabsTrigger>
            )}
            {authService.hasAccessToTab('production') && (
              <TabsTrigger value="production" className="text-white data-[state=active]:bg-yellow-600/50 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2"><Package className="w-3 h-3 sm:w-4 sm:h-4"/><span className="hidden sm:inline">Produção</span><span className="sm:hidden">Prod</span></TabsTrigger>
            )}
            {authService.hasAccessToTab('after-sales') && (
              <TabsTrigger value="after-sales" className="text-white data-[state=active]:bg-cyan-600/50 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2"><Bell className="w-3 h-3 sm:w-4 sm:h-4"/><span className="hidden sm:inline">Pós-venda</span><span className="sm:hidden">Pós</span></TabsTrigger>
            )}
          </TabsList>

          <div className="mt-4 sm:mt-6">
            {console.log('🔍 Renderizando TabsContent - activeTab:', activeTab)}
            <TabsContent value="overview">
              {console.log('🔍 Renderizando TabsContent overview')}
              <ProtectedRoute requiredLevel="overview" user={user} isAuthenticated={isAuthenticated}>
                <OverviewView data={dashboardData} />
              </ProtectedRoute>
            </TabsContent>
            <TabsContent value="development">
              {console.log('🔍 Renderizando TabsContent development')}
              <ProtectedRoute requiredLevel="development" user={user} isAuthenticated={isAuthenticated}>
                <DevelopmentView data={dashboardData} />
              </ProtectedRoute>
            </TabsContent>
            <TabsContent value="sales">
              {console.log('🔍 Renderizando TabsContent sales - activeTab:', activeTab)}
              <ProtectedRoute requiredLevel="sales" user={user} isAuthenticated={isAuthenticated}>
                <SalesView data={dashboardData} dateFilter={filterActive ? { startDate: appliedStartDate, endDate: appliedEndDate } : null} />
              </ProtectedRoute>
            </TabsContent>
            <TabsContent value="production">
              {console.log('🔍 Renderizando TabsContent production')}
              <ProtectedRoute requiredLevel="production" user={user} isAuthenticated={isAuthenticated}>
                <ProductionView data={dashboardData} />
              </ProtectedRoute>
            </TabsContent>
            <TabsContent value="after-sales">
              {console.log('🔍 Renderizando TabsContent after-sales')}
              <ProtectedRoute requiredLevel="after-sales" user={user} isAuthenticated={isAuthenticated}>
                <AfterSalesView orders={dashboardData.orders} />
              </ProtectedRoute>
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Dashboard;