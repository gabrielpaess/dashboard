import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from './ui/use-toast';
import Header from './Header';
import OverviewView from './views/OverviewView';
import DevelopmentView from './views/DevelopmentView';
import SalesView from './views/SalesView';
import ProductionView from './views/ProductionView';
import AfterSalesView from './views/AfterSalesView';
import Login from './Login';
import UserHeader from './UserHeader';
import ProtectedRoute from './ProtectedRoute';
import { Eye, Wrench, DollarSign, Package, Bell } from 'lucide-react';
import DateFilter from './DateFilter';
import { nestjsApiClient, nestjsDashboardService, validateApiConnection } from '../services';
import { DateFormatter } from '../services/utils/DateFormatter.js';

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
  const [syncInterval, setSyncInterval] = useState(900000); // 15 minutos por padrão
  const [lastSyncError, setLastSyncError] = useState(null);
  const { toast } = useToast();

  // Sincronizar com props do App
  useEffect(() => {
    
    if (propIsAuthenticated !== undefined) {
      setIsAuthenticated(propIsAuthenticated);
    }
    if (propUser !== undefined) {
      setUser(propUser);
    }
    setLoading(false);
  }, [propIsAuthenticated, propUser]);

  // Função para verificar acesso baseada no nível do usuário
  const hasAccessToTab = (tabLevel) => {
    if (!user?.nivel) {
      return false;
    }

    // Admin tem acesso a tudo
    if (user.nivel === 'admin') {
      return true;
    }

    // Mapear níveis de usuário para abas
    const levelToTabMap = {
      'vendas': 'sales',
      'desenvolvimento': 'development', 
      'producao': 'production',
      'admin': 'overview'
    };

    const userTab = levelToTabMap[user.nivel];
    return userTab === tabLevel;
  };

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

  // Função para calcular status baseado na data prevista e situação
  const calculateStatusBasedOnDate = (situacao, dataPrevista) => {
    // Se já foi entregue ou cancelado, manter o status
    if (situacao === 'Entregue') return 'delivered';
    if (situacao === 'Cancelado') return 'cancelled';
    if (situacao === 'Não Entregue') return 'not-delivered';
    
    // Se não tem data prevista, usar situação padrão
    if (!dataPrevista) {
      const statusMap = {
        'Em aberto': 'processing',
        'Aprovado': 'processing', 
        'Preparando envio': 'processing',
        'Faturado': 'invoiced',
        'Pronto para envio': 'ready-to-ship',
        'Enviado': 'shipped',
        'Entregue': 'delivered',
        'Não Entregue': 'not-delivered',
        'Cancelado': 'cancelled'
      };
      return statusMap[situacao] || 'processing';
    }
    
    // Calcular dias restantes usando a mesma lógica corrigida
    const diasRestantes = calculateDaysRemaining(dataPrevista);
    if (diasRestantes === undefined) {
      // Se não conseguiu calcular, usar situação padrão
      const statusMap = {
        'Em aberto': 'processing',
        'Aprovado': 'processing', 
        'Preparando envio': 'processing',
        'Faturado': 'invoiced',
        'Pronto para envio': 'ready-to-ship',
        'Enviado': 'shipped',
        'Entregue': 'delivered',
        'Não Entregue': 'not-delivered',
        'Cancelado': 'cancelled'
      };
      return statusMap[situacao] || 'processing';
    }
    
    const diffDays = diasRestantes;
    
    // Determinar status baseado na data conforme especificações:
    // data_prevista > 5: no prazo
    // data_prevista <= 5: em risco  
    // data_prevista <= 2: atrasado
    if (diffDays <= 2) {
      return 'late'; // Atrasado
    } else if (diffDays <= 5) {
      return 'risk'; // Em risco
    } else {
      return 'on-time'; // No prazo
    }
  };

  // Função para calcular dias restantes
  const calculateDaysRemaining = (dataPrevista) => {
    if (!dataPrevista) return undefined;
    const hoje = new Date();
    
    // Usar DateFormatter para parsear corretamente a data
    let dataPrev;
    if (typeof dataPrevista === 'string' && dataPrevista.includes('/') && !dataPrevista.startsWith('20')) {
      // Se está no formato DD/MM/YYYY, parsear corretamente
      const [day, month, year] = dataPrevista.split('/');
      dataPrev = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      // Para outros formatos, usar parseDate do DateFormatter
      dataPrev = DateFormatter.parseDate(dataPrevista);
    }
    
    if (!dataPrev || isNaN(dataPrev.getTime())) return undefined;
    
    const diffTime = dataPrev - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Função para ordenar pedidos por prioridade de SLA
  const sortOrdersBySLA = (pedidos) => {
    return pedidos.sort((a, b) => {
      // Calcular dias restantes para cada pedido
      const diasA = calculateDaysRemaining(a.data_prevista);
      const diasB = calculateDaysRemaining(b.data_prevista);
      
      // Pedidos sem data prevista ficam por último
      if (diasA === undefined && diasB === undefined) return 0;
      if (diasA === undefined) return 1;
      if (diasB === undefined) return -1;
      
      // Ordenar do mais atrasado (menor valor) para o menos atrasado (maior valor)
      return diasA - diasB;
    });
  };

  const fetchOrders = useCallback(async (isManualRefresh = false, useFilter = false) => {
    console.log('🔍 Dashboard - Iniciando fetchOrders...', { isManualRefresh, useFilter });
    
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('🔍 Dashboard - Buscando dados da API NestJS...');

      // Verificar se está autenticado - OBRIGATÓRIO
      if (!nestjsApiClient.isAuthenticated()) {
        console.log('❌ Usuário não autenticado - acesso negado');
        throw new Error('Usuário não autenticado. Faça login para acessar o dashboard.');
      }

      // Usuário autenticado - buscar dados completos
      console.log('🔐 Usuário autenticado, buscando dados completos...');
      
      // Buscar pedidos (requer autenticação)
      const response = await nestjsApiClient.request('/api/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🔍 Dashboard - Resposta da API NestJS:', response);
      
      if (!response.success) {
        if (response.isConnectivityError) {
          throw new Error('Erro de conectividade: Verifique se a API está rodando e acessível');
        }
        throw new Error(`Falha ao buscar dados da API: ${response.error}`);
      }
      
      // Processar dados para o formato esperado pelo dashboard
      let pedidos = response.data || [];
      
      // Aplicar filtros de data se necessário
      if (useFilter && appliedStartDate && appliedEndDate) {
        pedidos = pedidos.filter(pedido => {
          const dataPedido = new Date(pedido.data_pedido || pedido.created_at);
          const startDate = new Date(appliedStartDate);
          const endDate = new Date(appliedEndDate);
          return dataPedido >= startDate && dataPedido <= endDate;
        });
      }
      
      // Calcular total de pedidos excluindo os cancelados e não entregues
      const totalPedidos = pedidos.filter(p => p.situacao !== 'Cancelado' && p.situacao !== 'Não Entregue').length;
      const totalRevenue = pedidos.reduce((sum, pedido) => sum + (pedido.valor_total || 0), 0);
      const averageOrderValue = totalPedidos > 0 ? totalRevenue / totalPedidos : 0;

      // Calcular métricas por período (sempre baseado na data atual, não nos filtros)
      const today = new Date();
      
      // Para as metas, usar todos os pedidos (sem filtros de data)
      const allPedidos = response.data || [];

      const formatDate = (date) => {
        // Converter Date para formato DD/MM/YYYY
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Calcular períodos corretos para as metas
      const todayStr = formatDate(today);
      
      // Meta diária: pedidos do dia atual
      const dailyOrders = allPedidos.filter(p => {
        if (!p.data_pedido) return false;
        
        // Converter data_pedido para formato YYYY-MM-DD para comparação
        let pedidoDateStr;
        if (p.data_pedido.includes('/')) {
          // Se está no formato DD/MM/YYYY, converter para YYYY-MM-DD
          const [day, month, year] = p.data_pedido.split('/');
          pedidoDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else if (p.data_pedido.includes('-')) {
          // Se já está no formato YYYY-MM-DD, usar como está
          pedidoDateStr = p.data_pedido;
        } else {
          return false;
        }
        
        return pedidoDateStr === todayStr;
      });
      
      // Meta semanal: pedidos da semana atual (domingo a sábado)
      const startOfWeek = new Date(today);
      const day = today.getDay();
      const diff = today.getDate() - day; // Domingo = 0, então diff = 0
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo + 6 = Sábado
      endOfWeek.setHours(23, 59, 59, 999);
      
      const weeklyOrders = allPedidos.filter(p => {
        if (!p.data_pedido) return false;
        
        // Converter data_pedido para Date object
        let pedidoDate;
        if (p.data_pedido.includes('/')) {
          // Se está no formato DD/MM/YYYY, converter para Date
          const [day, month, year] = p.data_pedido.split('/');
          pedidoDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else if (p.data_pedido.includes('-')) {
          // Se está no formato YYYY-MM-DD, converter para Date
          pedidoDate = new Date(p.data_pedido + 'T00:00:00');
        } else {
          return false;
        }
        
        if (isNaN(pedidoDate.getTime())) return false;
        
        const isInWeek = pedidoDate >= startOfWeek && pedidoDate <= endOfWeek;
        
        // Debug para pedidos específicos
        if (p.numero && (p.situacao === 'Preparando envio' || p.situacao === 'Faturado')) {
          console.log('🔍 Debug Pedido Específico:', {
            numero: p.numero,
            situacao: p.situacao,
            data_pedido: p.data_pedido,
            pedidoDate: pedidoDate.toISOString().split('T')[0],
            startOfWeek: startOfWeek.toISOString().split('T')[0],
            endOfWeek: endOfWeek.toISOString().split('T')[0],
            isInWeek
          });
        }
        
        return isInWeek;
      });
      
      // Meta mensal: pedidos do mês atual
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      // Para exibição, usar o último dia do mês atual
      const endOfMonthDisplay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const monthlyOrders = allPedidos.filter(p => {
        if (!p.data_pedido) return false;
        
        // Converter data_pedido para Date object
        let pedidoDate;
        if (p.data_pedido.includes('/')) {
          // Se está no formato DD/MM/YYYY, converter para Date
          const [day, month, year] = p.data_pedido.split('/');
          pedidoDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else if (p.data_pedido.includes('-')) {
          // Se está no formato YYYY-MM-DD, converter para Date
          pedidoDate = new Date(p.data_pedido + 'T00:00:00');
        } else {
          return false;
        }
        
        if (isNaN(pedidoDate.getTime())) return false;
        
        // Verificar se está no mesmo mês e ano
        const isSameMonth = pedidoDate.getMonth() === startOfMonth.getMonth() && 
                           pedidoDate.getFullYear() === startOfMonth.getFullYear();
        
        return isSameMonth;
      });

      // Calcular receita por período com validação
      const dailyRevenue = dailyOrders.reduce((sum, p) => {
        const valor = parseFloat(p.valor_total) || 0;
        if (isNaN(valor)) {
          console.warn('⚠️ Valor inválido encontrado no pedido:', p.numero, 'valor_total:', p.valor_total);
        }
        return sum + valor;
      }, 0);
      
      const weeklyRevenue = weeklyOrders.reduce((sum, p) => {
        const valor = parseFloat(p.valor_total) || 0;
        if (isNaN(valor)) {
          console.warn('⚠️ Valor inválido encontrado no pedido:', p.numero, 'valor_total:', p.valor_total);
        }
        return sum + valor;
      }, 0);
      
      const monthlyRevenue = monthlyOrders.reduce((sum, p) => {
        const valor = parseFloat(p.valor_total) || 0;
        if (isNaN(valor)) {
          console.warn('⚠️ Valor inválido encontrado no pedido:', p.numero, 'valor_total:', p.valor_total);
        }
        return sum + valor;
      }, 0);

      // Logs de debug para vendas
      console.log('📊 Debug Vendas:', {
        dailyOrders: dailyOrders.length,
        dailyRevenue,
        weeklyOrders: weeklyOrders.length,
        weeklyRevenue,
        monthlyOrders: monthlyOrders.length,
        monthlyRevenue,
        todayStr,
        sampleDailyOrder: dailyOrders[0],
        sampleWeeklyOrder: weeklyOrders[0],
        sampleMonthlyOrder: monthlyOrders[0]
      });

      // Calcular WIP (Work in Progress) - situações específicas de produção
      const situacoesProducao = ['Em aberto', 'Aprovado', 'Preparando envio', 'Faturado'];
      const wipPedidos = pedidos.filter(p => situacoesProducao.includes(p.situacao));
      
      // Debug: verificar pedidos WIP
      console.log('📊 Debug WIP Pedidos:', {
        situacoesProducao,
        totalPedidos: pedidos.length,
        wipPedidos: wipPedidos.length,
        wipPedidosPorSituacao: wipPedidos.reduce((acc, p) => {
          const situacao = p.situacao;
          acc[situacao] = (acc[situacao] || 0) + 1;
          return acc;
        }, {}),
        sampleWipPedidos: wipPedidos.slice(0, 3).map(p => ({
          numero: p.numero,
          situacao: p.situacao,
          data_pedido: p.data_pedido
        }))
      });
      const wipTotal = wipPedidos.reduce((sum, pedido) => {
        if (pedido.itens_json && Array.isArray(pedido.itens_json)) {
          return sum + pedido.itens_json.reduce((itemSum, item) => {
            // Tentar ambas as estruturas: item.quantidade (estrutura real) ou item.item.quantidade (estrutura antiga)
            const quantidade = parseFloat(item.quantidade || item.item?.quantidade || 0);
            return itemSum + quantidade;
          }, 0);
        }
        return sum;
      }, 0);

      // Calcular pedidos da semana com situações específicas (Preparando envio e Faturado)
      // Incluir variações possíveis das situações
      const situacoesPedidosSemana = [
        'Preparando envio', 
        'Preparando para envio', 
        'Faturado',
        'FATURADO',
        'PREPARANDO ENVIO',
        'Preparando Envio'
      ];
      
      const weeklyProductionOrders = weeklyOrders.filter(p => {
        const situacao = p.situacao?.trim();
        return situacoesPedidosSemana.includes(situacao);
      });
      
      // Debug: verificar pedidos da semana
      console.log('📊 Debug Pedidos da Semana:', {
        totalWeeklyOrders: weeklyOrders.length,
        weeklyProductionOrders: weeklyProductionOrders.length,
        situacoesPedidosSemana,
        startOfWeek: startOfWeek.toISOString().split('T')[0],
        endOfWeek: endOfWeek.toISOString().split('T')[0],
        sampleOrders: weeklyOrders.slice(0, 3).map(p => ({
          numero: p.numero,
          situacao: p.situacao,
          data_pedido: p.data_pedido
        })),
        productionOrders: weeklyProductionOrders.map(p => ({
          numero: p.numero,
          situacao: p.situacao,
          data_pedido: p.data_pedido
        })),
        allSituacoes: [...new Set(weeklyOrders.map(p => p.situacao))],
        situacoesComPedidos: weeklyOrders.reduce((acc, p) => {
          const situacao = p.situacao?.trim();
          acc[situacao] = (acc[situacao] || 0) + 1;
          return acc;
        }, {})
      });
      



      // Breakdown por situação
      const breakdown = {};
      pedidos.forEach(pedido => {
        const situacao = pedido.situacao || 'Não informado';
        if (!breakdown[situacao]) {
          breakdown[situacao] = {
            count: 0,
            totalValue: 0,
            pedidos: []
          };
        }
        breakdown[situacao].count++;
        breakdown[situacao].totalValue += pedido.valor_total || 0;
        breakdown[situacao].pedidos.push(pedido);
      });

      
      // Verificar variações de case sensitivity e possíveis variações de texto
      const emAbertoCount = (breakdown['Em aberto']?.count || 0) + (breakdown['em aberto']?.count || 0);
      const aprovadoCount = (breakdown['Aprovado']?.count || 0) + (breakdown['aprovado']?.count || 0);
      
      // Contagem mais robusta para "Preparando envio" e "Pronto para envio" - considerar todas as possíveis variações
      let preparandoEnvioCount = 0;
      let prontoParaEnvioCount = 0;
      
      Object.keys(breakdown).forEach(situacao => {
        if (situacao && situacao.toLowerCase().includes('preparando')) {
          preparandoEnvioCount += breakdown[situacao].count;
        }
        if (situacao && situacao.toLowerCase().includes('pronto')) {
          prontoParaEnvioCount += breakdown[situacao].count;
        }
      });
      
      const faturadoCount = (breakdown['Faturado']?.count || 0) + (breakdown['faturado']?.count || 0);
      
      
      
      

      const processedData = {
        // Dados básicos
        pedidos: pedidos,
        totalPedidos: totalPedidos,
        totalRevenue: totalRevenue,
        averageOrderValue: averageOrderValue,

        // Métricas de vendas (formato esperado pelos componentes)
        salesMetrics: {
          daily: {
            current: dailyRevenue,
            previous: 0, // Seria calculado com dados históricos
            goal: 1000,
            orders: dailyOrders.length,
            period: todayStr
          },
          weekly: {
            current: weeklyRevenue,
            previous: 0, // Seria calculado com dados históricos
            goal: 7000,
            orders: weeklyOrders.length,
            period: `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`
          },
          monthly: {
            current: monthlyRevenue,
            previous: 0, // Seria calculado com dados históricos
            goal: 30000,
            orders: monthlyOrders.length,
            period: `${formatDate(startOfMonth)} - ${formatDate(endOfMonthDisplay)}`
          }
        },

        // Dados de produção
        productionData: {
          wip: {
            totalItens: wipTotal,
            totalPedidos: wipPedidos.length,
            pedidos: wipPedidos
          },
          wipByStage: {
            // Mapear breakdown para formato esperado pelo OverviewView
            'Total Ativos': totalPedidos,
            'Em Desenvolvimento': emAbertoCount + aprovadoCount,
            'Em Produção': preparandoEnvioCount + faturadoCount,
            'Preparando envio': preparandoEnvioCount,
            'Pronto para envio': prontoParaEnvioCount,
            'Faturado': faturadoCount,
            'Enviado': breakdown['Enviado']?.count || 0,
            'Entregue': breakdown['Entregue']?.count || 0,
            'Não Entregue': breakdown['Não Entregue']?.count || 0,
            'Cancelado': breakdown['Cancelado']?.count || 0
          },
          // Campos esperados pelo ProductionBreakdown
          // Calcular itens em produção (somar quantidades dos itens_json)
          itemsInProduction: (() => {
            const situacoesItensProducao = ['Preparando envio', 'Faturado'];
            const pedidosParaItensProducao = useFilter && appliedStartDate && appliedEndDate ? pedidos : allPedidos;
            const itensProducaoPedidos = pedidosParaItensProducao.filter(p => situacoesItensProducao.includes(p.situacao));
            
            return itensProducaoPedidos.reduce((sum, pedido) => {
              if (pedido.itens_json && Array.isArray(pedido.itens_json)) {
                return sum + pedido.itens_json.reduce((itemSum, item) => {
                  const quantidade = parseFloat(item.quantidade || item.item?.quantidade || 0);
                  return itemSum + quantidade;
                }, 0);
              }
              return sum;
            }, 0);
          })(),
          capacity: 1000, // Capacidade estimada
          demand: weeklyProductionOrders.length, // Pedidos da semana com situações de produção
          preparandoEnvio: breakdown['Preparando envio']?.count || 0,
          faturado: breakdown['Faturado']?.count || 0,
          // Adicionar dados de debug
          wipCalculationMethod: 'real',
          weeklyProductionOrders: weeklyProductionOrders.length,
          itensProducaoTotal: 0
        },

        // Dados de pedidos (mapeados para o formato esperado pelos componentes)
        // Filtrar pedidos para SLA - excluir situações que não devem ser consideradas
        orders: sortOrdersBySLA(pedidos.filter(pedido => {
          const situacoesExcluidas = ['Cancelado', 'Enviado', 'Entregue', 'Não Entregue'];
          return !situacoesExcluidas.includes(pedido.situacao);
        }).map(pedido => {
          const diasRestantes = calculateDaysRemaining(pedido.data_prevista);
          const status = calculateStatusBasedOnDate(pedido.situacao, pedido.data_prevista);
          
          return {
            ...pedido,
            // Calcular status baseado na data prevista
            status: status,
            // Adicionar campos necessários para DeliveryStatus
            willBeLate: diasRestantes !== undefined && diasRestantes <= 2 && diasRestantes >= 0,
            deliveryDate: pedido.situacao === 'Entregue' ? DateFormatter.parseDate(pedido.data_prevista) : null,
            promisedDate: pedido.data_prevista ? DateFormatter.parseDate(pedido.data_prevista) : null,
            // Adicionar campos para cálculo de dias
            diasRestantes: diasRestantes,
            // Mapear campos da API para formato esperado
            order_id: pedido.numero || pedido.id,
            customer: pedido.nome_cliente,
            // Mapear itens para o formato esperado
            items: Array.isArray(pedido.itens_json) ? pedido.itens_json.map((item, index) => ({
              id: item.id || index,
              sku: item.sku || item.codigo || 'N/A',
              title: item.descricao || item.nome || item.titulo || 'Item sem descrição',
              stage: item.etapa || item.stage || 'Pendente',
              stage_eta_at: item.data_prevista || item.eta || null,
              quantidade: item.quantidade || 1,
              valor: item.valor || 0
            })) : []
          };
        })),

        // Breakdown por situação
        breakdown: breakdown,

        // Dados de desenvolvimento
        developmentData: {
          // Aprovar Arte = pedidos com situação "Em aberto"
          backlog: emAbertoCount,
          // Ajustar Arquivo = pedidos com situação "Aprovado" 
          developedThisPeriod: aprovadoCount,
          // Projetos em andamento = todos os pedidos "Em aberto" e "Aprovado" ordenados por prazo
          projects: pedidos
            .filter(p => {
              const situacao = p.situacao?.toLowerCase() || '';
              const isEmAberto = situacao === 'em aberto' || situacao === 'em_aberto' || situacao === 'emaberto';
              const isAprovado = situacao === 'aprovado' || situacao === 'approved';
              return isEmAberto || isAprovado;
            })
            .map(pedido => {
              const diasRestantes = calculateDaysRemaining(pedido.data_prevista);
              const status = calculateStatusBasedOnDate(pedido.situacao, pedido.data_prevista);
              
              // Determinar status para exibição
              let statusDisplay = 'No Prazo';
              if (status === 'late') statusDisplay = 'Atrasado';
              else if (status === 'risk') statusDisplay = 'Em Risco';
              else if (status === 'delivered') statusDisplay = 'Entregue';
              else if (status === 'cancelled') statusDisplay = 'Cancelado';
              
              return {
                id: pedido.id,
                name: `Pedido #${pedido.numero} - ${pedido.nome_cliente}`,
                status: statusDisplay,
                situacao: pedido.situacao,
                deadline: pedido.data_prevista ? DateFormatter.formatToPTBR(pedido.data_prevista) : 'Sem prazo',
                diasRestantes: diasRestantes,
                valor: pedido.valor_total || 0
              };
            })
            .sort((a, b) => {
              // Ordenar por dias restantes (menos dias = mais crítico)
              if (a.diasRestantes === undefined && b.diasRestantes === undefined) return 0;
              if (a.diasRestantes === undefined) return 1;
              if (b.diasRestantes === undefined) return -1;
              return a.diasRestantes - b.diasRestantes;
            })
        }
      };
      
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
    // Função para executar sincronização automática (removida - sincronização agora é feita no backend)
    const performAutoSync = async () => {
      // Sincronização agora é feita via GitHub Actions e APIs da Vercel
      // Não precisa mais de sincronização no frontend
      console.log('ℹ️ Sincronização automática desabilitada - usando GitHub Actions');
    };

    // Executar sincronização inicial
    performAutoSync();
    
    // Carregar dados iniciais com filtro padrão (últimos 7 dias)
    fetchOrders(false, true); // useFilter = true para usar filtro padrão
    
    // Atualizar dados com intervalo dinâmico
    const interval = setInterval(() => {
      // Executar sincronização antes de buscar dados
      performAutoSync();
      // Buscar dados com filtro atual (se ativo) ou sem filtro
      fetchOrders(false, filterActive);
    }, syncInterval);
    
    return () => clearInterval(interval);
  }, [fetchOrders, filterActive, appliedStartDate, appliedEndDate, syncInterval]);

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
          setActiveTab(newValue);
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 glass-effect p-1 h-auto gap-1">
            {hasAccessToTab('overview') && (
              <TabsTrigger value="overview" className="text-white data-[state=active]:bg-teal-600/50 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2"><Eye className="w-3 h-3 sm:w-4 sm:h-4"/><span className="hidden sm:inline">Visão Geral</span><span className="sm:hidden">Geral</span></TabsTrigger>
            )}
            {hasAccessToTab('sales') && (
              <TabsTrigger value="sales" className="text-white data-[state=active]:bg-green-600/50 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2"><DollarSign className="w-3 h-3 sm:w-4 sm:h-4"/><span className="hidden sm:inline">Vendas</span><span className="sm:hidden">Vendas</span></TabsTrigger>
            )}
            {hasAccessToTab('development') && (
              <TabsTrigger value="development" className="text-white data-[state=active]:bg-pink-600/50 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2"><Wrench className="w-3 h-3 sm:w-4 sm:h-4"/><span className="hidden sm:inline">Desenvolvimento</span><span className="sm:hidden">Dev</span></TabsTrigger>
            )}
            {hasAccessToTab('production') && (
              <TabsTrigger value="production" className="text-white data-[state=active]:bg-yellow-600/50 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2"><Package className="w-3 h-3 sm:w-4 sm:h-4"/><span className="hidden sm:inline">Produção</span><span className="sm:hidden">Prod</span></TabsTrigger>
            )}
            {hasAccessToTab('after-sales') && (
              <TabsTrigger value="after-sales" className="text-white data-[state=active]:bg-cyan-600/50 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2"><Bell className="w-3 h-3 sm:w-4 sm:h-4"/><span className="hidden sm:inline">Pós-venda</span><span className="sm:hidden">Pós</span></TabsTrigger>
            )}
          </TabsList>

          <div className="mt-4 sm:mt-6">
            <TabsContent value="overview">
              <ProtectedRoute requiredLevel="overview" user={user} isAuthenticated={isAuthenticated}>
                <OverviewView data={dashboardData} />
              </ProtectedRoute>
            </TabsContent>
            <TabsContent value="development">
              <ProtectedRoute requiredLevel="development" user={user} isAuthenticated={isAuthenticated}>
                <DevelopmentView data={dashboardData} />
              </ProtectedRoute>
            </TabsContent>
            <TabsContent value="sales">
              <ProtectedRoute requiredLevel="sales" user={user} isAuthenticated={isAuthenticated}>
                <SalesView data={dashboardData} dateFilter={filterActive ? { startDate: appliedStartDate, endDate: appliedEndDate } : null} />
              </ProtectedRoute>
            </TabsContent>
            <TabsContent value="production">
              <ProtectedRoute requiredLevel="production" user={user} isAuthenticated={isAuthenticated}>
                <ProductionView data={dashboardData} />
              </ProtectedRoute>
            </TabsContent>
            <TabsContent value="after-sales">
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