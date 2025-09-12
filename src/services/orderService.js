// Service para processar dados dos pedidos
import { fetchMultipleOrderDetails, testOrderDetailsAPI } from './tinyApiService.js';
import { pedidosCentralizedService } from './pedidosCentralizedService.js';

class OrderService {
  // Mapear situação para status de entrega
  mapSituacaoToStatus(situacao) {
    const statusMap = {
      'Em aberto': 'on-time',
      'Aprovado': 'on-time',
      'Preparando envio': 'on-time',
      'Faturado': 'on-time',
      'Enviado': 'shipped',
      'Entregue': 'delivered',
      'Cancelado': 'cancelled'
    };
    return statusMap[situacao] || 'on-time';
  }

  // Mapear situação para status de SLA (mais específico)
  mapSituacaoToSLAStatus(situacao, diasRestantes) {
    if (!situacao) return 'unknown';
    
    const situacaoLower = situacao.toLowerCase();
    
    // Se já foi entregue
    if (situacaoLower === 'entregue') {
      return 'delivered';
    }
    
    // Se foi cancelado
    if (situacaoLower === 'cancelado') {
      return 'cancelled';
    }
    
    // Se foi enviado
    if (situacaoLower === 'enviado') {
      return 'shipped';
    }
    
    // Para pedidos em andamento, verificar prazo
    if (diasRestantes === null) {
      return 'unknown';
    } else if (diasRestantes < 0) {
      return 'late'; // Atrasado (dias negativos)
    } else if (diasRestantes <= 2) {
      return 'late'; // Atrasado (<=2 dias restantes)
    } else if (diasRestantes <= 5) {
      return 'risk'; // Em risco (<=5 dias restantes)
    } else {
      return 'on-time'; // No prazo (>5 dias restantes)
    }
  }

  // Calcular se vai atrasar
  calculateWillBeLate(dataPrevista) {
    if (!dataPrevista) return false;
    
    try {
      const hoje = new Date();
      // Criar data no fuso horário local para evitar problemas de UTC
      const dataEntrega = this.createLocalDate(dataPrevista);
      if (!dataEntrega) return false;
      
      const diasRestantes = Math.ceil((dataEntrega - hoje) / (1000 * 60 * 60 * 24));
      return diasRestantes <= 5;
    } catch (error) {
      console.error('Erro ao calcular willBeLate:', error);
      return false;
    }
  }

  // Calcular dias restantes
  calculateDiasRestantes(dataPrevista) {
    if (!dataPrevista) return 0;
    
    try {
      const hoje = new Date();
      // Criar data no fuso horário local para evitar problemas de UTC
      const dataEntrega = this.createLocalDate(dataPrevista);
      if (!dataEntrega) return 0;
      
      return Math.ceil((dataEntrega - hoje) / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Erro ao calcular dias restantes:', error);
      return 0;
    }
  }

  // Formatar data para PT-BR (DD/MM/YYYY) - apenas formatação de texto
  formatDateToPTBR(dateString) {
    if (!dateString) return null;
    
    try {
      // Se já está no formato YYYY-MM-DD
      if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // Se já está no formato DD/MM/YYYY
      if (dateString.includes('/')) {
        return dateString;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao formatar data para PT-BR:', dateString, error);
      return null;
    }
  }

  // Criar data no fuso horário local (apenas para cálculos)
  createLocalDate(dateString) {
    if (!dateString) return null;
    
    try {
      // Se está no formato YYYY-MM-DD
      if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        // Criar data no fuso horário local (não UTC) - definir hora como meio-dia para evitar problemas de fuso
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
      }
      
      // Se está no formato DD/MM/YYYY
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao criar data local:', dateString, error);
      return null;
    }
  }

  // Processar itens JSON
  processItensJson(itensJson) {
    if (!Array.isArray(itensJson)) return [];
    
    return itensJson.map((item, index) => ({
      id: `${item.item?.id_produto || index}`,
      sku: item.item?.codigo || `ITEM-${index}`,
      title: item.item?.descricao || 'Item sem descrição',
      stage: 'Em Produção',
      stage_eta_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      quantidade: parseFloat(item.item?.quantidade || 0)
    }));
  }

  // Calcular WIP por estágio
  calculateWIPByStage(breakdownSituacao) {
    return {
      'Vendido': breakdownSituacao['Em aberto']?.count || 0,
      'Em Produção': (breakdownSituacao['Preparando envio']?.count || 0) + 
                    (breakdownSituacao['Faturado']?.count || 0),
      'Em Desenvolvimento': breakdownSituacao['Em aberto']?.count || 0,
      'Em Aberto': breakdownSituacao['Em aberto']?.count || 0,
      'Preparando Envio': breakdownSituacao['Preparando envio']?.count || 0,
      'Faturado': breakdownSituacao['Faturado']?.count || 0,
      'Enviado': breakdownSituacao['Enviado']?.count || 0,
      'Entregue': breakdownSituacao['Entregue']?.count || 0,
      'Cancelado': breakdownSituacao['Cancelado']?.count || 0,
      'Total Ativos': Object.values(breakdownSituacao).reduce((sum, item) => sum + (item?.count || 0), 0)
    };
  }

  // Processar dados usando tabela pedidos centralizada
  async processOrderDataCentralized(dateFilter = null) {
    try {
      console.log('🔄 Processing order data using centralized pedidos table...');
      
      const filters = dateFilter ? {
        dataInicial: dateFilter.startDate,
        dataFinal: dateFilter.endDate
      } : {};
      
      // Buscar dados da tabela pedidos centralizada
      const wipData = await pedidosCentralizedService.getWIPTotal(filters);
      const pedidosProducao = await pedidosCentralizedService.getPedidosProducao(filters);
      const pedidosSemana = await pedidosCentralizedService.getPedidosSemana(filters);
      const breakdownSituacao = await pedidosCentralizedService.getBreakdownSituacao(filters);
      const metricasVendas = await pedidosCentralizedService.getMetricasVendas(filters);
      const metricasVendasPorPeriodo = await pedidosCentralizedService.getMetricasVendasPorPeriodo();
      
      // Processar pedidos para compatibilidade com componentes existentes
      const orders = pedidosProducao.map(pedido => {
        // Usar formatação simples de texto para datas (sem conversão de fuso horário)
        const promisedDate = pedido.data_prevista ? this.formatDateToPTBR(pedido.data_prevista) : null;
        const createdDate = this.formatDateToPTBR(pedido.data_pedido);
        
        const diasRestantes = this.calculateDiasRestantes(pedido.data_prevista);
        const slaStatus = this.mapSituacaoToSLAStatus(pedido.situacao, diasRestantes);
        
        return {
          id: pedido.id,
          order_id: pedido.numero,
          customer: pedido.nome_cliente,
          createdDate,
          promisedDate,
          deliveryDate: pedido.situacao === 'Entregue' ? promisedDate : null,
          status: slaStatus, // Usar slaStatus em vez de mapSituacaoToStatus
          willBeLate: this.calculateWillBeLate(pedido.data_prevista),
          eta: promisedDate,
          riskReason: this.calculateWillBeLate(pedido.data_prevista) ? 'Em risco de atraso' : null,
          valor: pedido.valor_total || 0,
          vendedor: pedido.nome_vendedor || 'Não informado',
          situacao: pedido.situacao,
          diasRestantes: diasRestantes,
          slaStatus: slaStatus,
          slaPriority: slaStatus === 'late' ? 'critical' : 
                      slaStatus === 'critical' ? 'critical' : 
                      slaStatus === 'at-risk' ? 'high' : 
                      slaStatus === 'on-time' ? 'medium' : 'low',
          items: this.processItensJson(pedido.itens_json || []),
          envio_15: pedido.envio_15,
          envio_45: pedido.envio_45
        };
      }).sort((a, b) => {
        // Prioridade 1: Status (Atrasado > Em Risco > No Prazo)
        const statusPriority = { 'late': 1, 'risk': 2, 'on-time': 3, 'delivered': 4, 'cancelled': 5 };
        const aPriority = statusPriority[a.status] || 6;
        const bPriority = statusPriority[b.status] || 6;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Prioridade 2: Dias restantes (menos dias = mais crítico)
        return a.diasRestantes - b.diasRestantes;
      });
      
      // Calcular métricas de produção
      const wipByStage = this.calculateWIPByStage(breakdownSituacao);
      const demand = pedidosSemana.length;
      const capacity = Math.max(250, demand * 1.2);
      const preparandoEnvio = breakdownSituacao['Preparando envio']?.count || 0;
      const faturado = breakdownSituacao['Faturado']?.count || 0;
      
      return {
        orders,
        productionData: {
          itemsInProduction: wipData.totalItens,
          wipByStage,
          capacity,
          demand,
          preparandoEnvio,
          faturado,
          wipCalculationMethod: 'centralized'
        },
        salesMetrics: {
          totalRevenue: metricasVendas.totalRevenue,
          totalOrders: metricasVendas.totalPedidos,
          averageOrderValue: metricasVendas.averageOrderValue,
          daily: metricasVendasPorPeriodo.daily,
          weekly: metricasVendasPorPeriodo.weekly,
          monthly: metricasVendasPorPeriodo.monthly
        },
        developmentData: {
          // Aprovar Arte = pedidos com situação "Em aberto"
          backlog: breakdownSituacao['Em aberto']?.count || 0,
          // Ajustar Arquivo = pedidos com situação "Aprovado" (se existir)
          developedThisPeriod: breakdownSituacao['Aprovado']?.count || 0,
          // Projetos em andamento = pedidos "Em aberto" e "Aprovado" ordenados por prazo
          projects: orders
            .filter(o => {
              const situacao = o.situacao?.toLowerCase() || '';
              return situacao === 'em aberto' || situacao === 'aprovado';
            })
            .sort((a, b) => a.diasRestantes - b.diasRestantes)
            .map((order, index) => ({
              id: order.id,
              name: `Pedido ${order.order_id} - ${order.customer}`,
              status: order.status === 'late' ? 'Atrasado' : 
                     order.status === 'risk' ? 'Em Risco' : 
                     order.status === 'on-time' ? 'No Prazo' : 
                     order.status === 'delivered' ? 'Entregue' : 'Em Andamento',
              progress: order.status === 'delivered' ? 100 : 
                       order.status === 'late' ? 30 : 
                       order.status === 'risk' ? 60 : 75,
              deadline: order.promisedDate ? order.promisedDate : null,
              priority: order.slaPriority === 'critical' ? 'Alta' : 
                       order.slaPriority === 'high' ? 'Média' : 'Baixa',
              description: `Pedido para ${order.customer} - ${order.situacao}`,
              diasRestantes: order.diasRestantes,
              situacao: order.situacao
            }))
        }
      };
      
    } catch (error) {
      console.error('❌ Erro ao processar dados centralizados:', error);
      throw error;
    }
  }

  // Calcular WIP Total baseado nas quantidades reais dos itens
  async calculateWIPTotal(apiOrders, token) {
    try {
      console.log('🔍 Calculating WIP Total with real item quantities...');
      
      // Filtrar pedidos em produção (Em aberto, Aprovado, Preparando envio, Faturado)
      const activeOrders = apiOrders.filter(o => {
        const situacao = o.pedido.situacao;
        return ['Em aberto', 'Aprovado', 'Preparando envio', 'Faturado'].includes(situacao);
      });
      
      if (activeOrders.length === 0) {
        console.log('ℹ️ No active orders found for WIP calculation');
        return 0;
      }
      
      // Extrair IDs dos pedidos ativos
      const orderIds = activeOrders.map(o => parseInt(o.pedido.id));
      console.log(`📊 Found ${orderIds.length} active orders for WIP calculation`);
      
      // Testar API com o primeiro pedido antes de fazer consultas em lote
      if (orderIds.length > 0) {
        console.log('🧪 Testing API with first order before batch processing...');
        const testResult = await testOrderDetailsAPI(token, orderIds[0]);
        if (!testResult.success) {
          console.error('❌ API test failed, using fallback calculation');
          throw new Error(`API test failed: ${testResult.error}`);
        }
        console.log('✅ API test successful, proceeding with batch processing...');
      }
      
      // Limitar a 5 pedidos por vez para evitar exceder limite da API
      const limitedOrderIds = orderIds.slice(0, 5);
      if (orderIds.length > 5) {
        console.log(`⚠️ Limiting to first 5 orders (${orderIds.length} total) to avoid API limits`);
      }
      
      // Buscar detalhes dos pedidos com timeout
      const orderDetails = await Promise.race([
        fetchMultipleOrderDetails(token, limitedOrderIds),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: API request took too long')), 30000)
        )
      ]);
      
      // Calcular total de itens baseado nas quantidades reais
      let totalWIPItems = 0;
      let processedOrders = 0;
      const itensDetalhados = []; // Array para armazenar detalhes dos itens
      
      console.log(`📊 Processing ${orderDetails.length} order details...`);
      
      orderDetails.forEach((detail, index) => {
        console.log(`🔍 Processing order detail ${index + 1}:`, {
          hasRetorno: !!detail?.retorno,
          hasPedido: !!detail?.retorno?.pedido,
          hasItens: !!detail?.retorno?.pedido?.itens,
          itensCount: detail?.retorno?.pedido?.itens?.length || 0
        });
        
        if (detail && detail.retorno && detail.retorno.pedido && detail.retorno.pedido.itens) {
          const items = detail.retorno.pedido.itens;
          const pedidoData = detail.retorno.pedido;
          
          console.log(`📦 Order ${index + 1} has ${items.length} items:`, items.map(item => ({
            descricao: item.item.descricao,
            quantidade: item.item.quantidade
          })));
          
          items.forEach(item => {
            const quantity = parseFloat(item.item.quantidade) || 0;
            totalWIPItems += quantity;
            
            // Armazenar detalhes do item para log
            itensDetalhados.push({
              pedido_id: pedidoData.id,
              numero: pedidoData.numero,
              situacao: pedidoData.situacao,
              descricao: item.item.descricao,
              quantidade: quantity
            });
            
            console.log(`➕ Added ${quantity} items (${item.item.descricao})`);
          });
          processedOrders++;
        } else {
          console.warn(`⚠️ Order detail ${index + 1} missing required data:`, detail);
        }
      });
      
      // Log detalhado dos itens em produção (API)
      console.log('📦 ITENS EM PRODUÇÃO (API) - Detalhamento:');
      console.log(`📊 Total de itens: ${totalWIPItems}`);
      console.log(`📋 Total de pedidos processados: ${processedOrders}`);
      console.log('🔍 Itens por pedido:');
      
      itensDetalhados.forEach((item, index) => {
        console.log(`   ${index + 1}. Pedido ${item.numero} (${item.situacao}) - ${item.descricao} - ${item.quantidade} itens`);
      });
      
      console.log(`✅ WIP Total calculated: ${totalWIPItems} items from ${processedOrders} orders`);
      return totalWIPItems;
      
    } catch (error) {
      console.error('❌ Error calculating WIP Total:', error.message);
      
      // Fallback: retornar contagem simples de pedidos ativos
      const activeOrders = apiOrders.filter(o => {
        const situacao = o.pedido.situacao;
        return ['Em aberto', 'Aprovado', 'Preparando envio', 'Faturado'].includes(situacao);
      });
      
      console.log(`📊 Using fallback calculation: ${activeOrders.length} active orders`);
      // NOTA: Este é um fallback que retorna contagem de pedidos, não itens
      // O valor real deve vir do data warehouse ou API
      return activeOrders.length;
    }
  }

  // Calcular WIP Total baseado em filtros de data do dashboard
  async calculateWIPTotalWithDateFilter(startDate, endDate) {
    try {
      console.log(`🔍 Calculating WIP Total with date filter: ${startDate} to ${endDate}`);
      
      // Usar serviço centralizado para cálculo baseado em filtros de data
      const wipData = await pedidosCentralizedService.getWIPTotal({ 
        dataInicial: startDate, 
        dataFinal: endDate 
      });
      
      console.log(`📊 WIP Total with date filter: ${wipData.totalItens} items`);
      console.log(`📊 Active orders in period: ${wipData.totalPedidos}`);
      
      return {
        itemsInProduction: wipData.totalItens,
        wipCalculationMethod: 'warehouse_filtered',
        totalPedidosAtivos: wipData.totalPedidos,
        itensDetalhados: wipData.itensDetalhados,
        pedidos: wipData.pedidos
      };
      
    } catch (error) {
      console.error('❌ Error calculating WIP Total with date filter:', error);
      
      // Fallback: usar dados da API filtrados
      const filteredOrders = apiOrders.filter(order => {
        const orderDate = order.pedido.data_pedido;
        if (!orderDate) return false;
        
        // Converter data do pedido para formato de comparação
        const [dia, mes, ano] = orderDate.split('/');
        const orderDateFormatted = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        
        return orderDateFormatted >= startDate && orderDateFormatted <= endDate;
      });
      
      // Calcular WIP Total dos pedidos filtrados
      const activeFilteredOrders = filteredOrders.filter(o => {
        const situacao = o.pedido.situacao;
        return ['Em aberto', 'Aprovado', 'Preparando envio', 'Faturado'].includes(situacao);
      });
      
      return {
        itemsInProduction: activeFilteredOrders.length,
        wipCalculationMethod: 'api_filtered',
        totalPedidosAtivos: activeFilteredOrders.length,
        situacoesCount: {},
        dateRange: { startDate, endDate }
      };
    }
  }

  // Processar dados dos pedidos para o dashboard (prioriza Supabase)
  async processOrderData(apiOrders = null, token = null, dateFilter = null) {
    try {
      console.log('🔄 Processing order data for dashboard...');
      
      // Tentar usar dados centralizados primeiro
      try {
        console.log('🏪 Attempting to use centralized pedidos table...');
        const centralizedData = await this.processOrderDataCentralized(dateFilter);
        console.log('✅ Successfully using centralized data');
        return centralizedData;
      } catch (centralizedError) {
        console.warn('⚠️ Centralized data not available, falling back to API data:', centralizedError.message);
        
        // Fallback para dados da API (se disponível)
        if (apiOrders && token) {
          return await this.processOrderDataFromAPI(apiOrders, token, dateFilter);
        } else {
          throw new Error('No centralized data available and no API fallback provided');
        }
      }
    } catch (error) {
      console.error('❌ Error processing order data:', error);
      throw error;
    }
  }

  // Processar dados da API (fallback)
  async processOrderDataFromAPI(apiOrders, token = null, dateFilter = null) {
    // Debug: Mostrar todas as situações únicas que estão vindo da API
    const situacoesUnicas = [...new Set(apiOrders.map(o => o.pedido.situacao))];
    console.log('🔍 Situações únicas da API:', situacoesUnicas);
    
    // Debug: Contar pedidos por situação
    const contagemPorSituacao = situacoesUnicas.reduce((acc, situacao) => {
      acc[situacao] = apiOrders.filter(o => o.pedido.situacao === situacao).length;
      return acc;
    }, {});
    console.log('📊 Contagem por situação:', contagemPorSituacao);
    
    const orders = apiOrders.map(({ pedido }) => {
      const createdDate = this.createLocalDate(pedido.data_pedido.split('/').reverse().join('-'));
      const promisedDate = pedido.data_prevista ? this.createLocalDate(pedido.data_prevista.split('/').reverse().join('-')) : null;
      
      // Sistema inteligente de status de entrega (SLA)
      let status = 'on-time';
      let willBeLate = false;
      let riskReason = null;
      
      // Calcular dias restantes para entrega
      const hoje = new Date();
      const diasRestantes = promisedDate ? Math.ceil((promisedDate - hoje) / (1000 * 60 * 60 * 24)) : null;
      
      if (pedido.situacao === 'Entregue') {
        status = 'delivered';
      } else if (pedido.situacao === 'Cancelado') {
        status = 'cancelled';
        riskReason = 'Pedido cancelado';
      } else if (pedido.situacao === 'Enviado') {
        status = 'shipped';
        // Se enviado mas próximo do prazo, considerar atrasado
        if (diasRestantes !== null && diasRestantes <= 2) {
          status = 'late';
          willBeLate = true;
          riskReason = 'Enviado mas atrasado';
        } else if (diasRestantes !== null && diasRestantes <= 5) {
          status = 'risk';
          willBeLate = true;
          riskReason = 'Enviado mas em risco';
        }
      } else if (pedido.situacao === 'Faturado') {
        status = 'invoiced';
        // Se faturado mas próximo do prazo, considerar em risco
        if (diasRestantes !== null && diasRestantes <= 2) {
          status = 'late';
          willBeLate = true;
          riskReason = 'Faturado mas atrasado';
        } else if (diasRestantes !== null && diasRestantes <= 5) {
          status = 'risk';
          willBeLate = true;
          riskReason = 'Faturado mas próximo do prazo';
        }
      } else if (pedido.situacao === 'Preparando envio' || pedido.situacao === 'Pronto para envio') {
        // Lógica inteligente baseada em dias restantes
        if (diasRestantes !== null && diasRestantes <= 2) {
          status = 'late';
          willBeLate = true;
          riskReason = 'Atrasado na preparação';
        } else if (diasRestantes !== null && diasRestantes <= 5) {
          status = 'risk';
          willBeLate = true;
          riskReason = 'Em risco - preparando envio';
        } else {
          status = 'on-time';
        }
      } else if (pedido.situacao === 'Em aberto') {
        // Lógica inteligente para pedidos em aberto
        if (diasRestantes !== null && diasRestantes <= 2) {
          status = 'late';
          willBeLate = true;
          riskReason = 'Atrasado - ainda em aberto';
        } else if (diasRestantes !== null && diasRestantes <= 5) {
          status = 'risk';
          willBeLate = true;
          riskReason = 'Em risco - pedido em aberto';
        } else {
          status = 'on-time';
        }
      } else if (pedido.situacao === 'aprovado') {
        // Lógica para pedidos aprovados
        if (diasRestantes !== null && diasRestantes <= 2) {
          status = 'late';
          willBeLate = true;
          riskReason = 'Atrasado - aprovado mas não processado';
        } else if (diasRestantes !== null && diasRestantes <= 5) {
          status = 'risk';
          willBeLate = true;
          riskReason = 'Em risco - aprovado recentemente';
        } else {
          status = 'on-time';
        }
      } else {
        // Situação não mapeada - aplicar lógica de data
        if (diasRestantes !== null && diasRestantes <= 2) {
          status = 'late';
          willBeLate = true;
          riskReason = 'Atrasado na entrega';
        } else if (diasRestantes !== null && diasRestantes <= 5) {
          status = 'risk';
          willBeLate = true;
          riskReason = 'Em risco de atraso';
        } else {
          status = 'on-time';
        }
      }

      return {
        id: pedido.id,
        order_id: pedido.numero,
        customer: pedido.nome || 'Cliente não informado',
        createdDate,
        promisedDate,
        deliveryDate: pedido.situacao === 'Entregue' ? 
          (pedido.data_prevista ? this.createLocalDate(pedido.data_prevista.split('/').reverse().join('-')) : 
           new Date(createdDate.getTime() + 5 * 24 * 60 * 60 * 1000)) : null,
        status,
        willBeLate,
        eta: promisedDate,
        riskReason,
        valor: parseFloat(pedido.valor || 0),
        vendedor: pedido.nome_vendedor || 'Não informado',
        situacao: pedido.situacao,
        // Informações extras para SLA
        diasRestantes,
        slaStatus: status,
        slaPriority: diasRestantes === null ? 'low' : diasRestantes <= 2 ? 'critical' : diasRestantes <= 5 ? 'high' : diasRestantes <= 10 ? 'medium' : 'low',
        items: [{
          id: pedido.id + '-1',
          sku: pedido.numero_ecommerce || `PED-${pedido.numero}`,
          title: 'Quadro Personalizado',
          stage: pedido.situacao,
          stage_eta_at: promisedDate
        }]
      };
    }).sort((a, b) => {
      // Prioridade 1: Status (Atrasado > Em Risco > No Prazo)
      const statusPriority = { 'late': 1, 'risk': 2, 'on-time': 3, 'delivered': 4, 'cancelled': 5 };
      const aPriority = statusPriority[a.status] || 6;
      const bPriority = statusPriority[b.status] || 6;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Prioridade 2: Dias restantes (menos dias = mais crítico)
      return a.diasRestantes - b.diasRestantes;
    });

    // Calcular total de pedidos ativos (excluindo cancelados)
    const totalPedidosAtivos = apiOrders.filter(o => o.pedido.situacao !== 'Cancelado').length;
    
    const wipByStage = {
      // Mapeamento para os estágios da interface baseado nas situações reais da API
      'Vendido': apiOrders.filter(o => o.pedido.situacao === 'Em aberto').length,
      'Em Produção': apiOrders.filter(o => 
        o.pedido.situacao === 'Preparando envio' || 
        o.pedido.situacao === 'Faturado'
      ).length,
      'Em Desenvolvimento': apiOrders.filter(o => 
        o.pedido.situacao === 'Em aberto'
      ).length, // Apenas pedidos "Em aberto" estão em desenvolvimento
      
      // Manter os estágios originais para compatibilidade
      'Em Aberto': apiOrders.filter(o => o.pedido.situacao === 'Em aberto').length,
      'Preparando Envio': apiOrders.filter(o => o.pedido.situacao === 'Preparando envio').length,
      'Pronto para Envio': apiOrders.filter(o => o.pedido.situacao === 'Pronto para envio').length,
      'Enviado': apiOrders.filter(o => o.pedido.situacao === 'Enviado').length,
      'Faturado': apiOrders.filter(o => o.pedido.situacao === 'Faturado').length,
      'Entregue': apiOrders.filter(o => o.pedido.situacao === 'Entregue').length,
      'Cancelado': apiOrders.filter(o => o.pedido.situacao === 'Cancelado').length,
      // Adicionar total de pedidos ativos
      'Total Ativos': totalPedidosAtivos,
    };
    
    // Debug: Mostrar contagem dos estágios mapeados
    
    // Debug: Mostrar dados específicos de desenvolvimento
    const pedidosAprovados = apiOrders.filter(o => o.pedido.situacao === 'aprovado');
    
    // Debug: Mostrar status de SLA calculados
    const statusSLA = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    
    // Debug: Mostrar exemplos de pedidos por status
    const exemplosPorStatus = ['on-time', 'risk', 'late', 'delivered'].reduce((acc, status) => {
      const pedidosComStatus = orders.filter(o => o.status === status);
      if (pedidosComStatus.length > 0) {
        acc[status] = pedidosComStatus.slice(0, 2).map(p => ({
          id: p.id,
          order_id: p.order_id,
          situacao: p.situacao,
          diasRestantes: p.diasRestantes,
          riskReason: p.riskReason
        }));
      }
      return acc;
    }, {});
    
    // Validação: Verificar se a soma dos estágios principais bate com o total
    const totalMapeado = wipByStage['Vendido'] + wipByStage['Em Produção'] + wipByStage['Em Desenvolvimento'];
    const totalOriginal = apiOrders.length;

    const preparandoEnvio = apiOrders.filter(o => 
      o.pedido.situacao === 'Preparando envio'
    ).length;

    const faturado = apiOrders.filter(o => 
      o.pedido.situacao === 'Faturado'
    ).length;

    const totalRevenue = apiOrders.reduce((sum, { pedido }) => sum + parseFloat(pedido.valor || 0), 0);
    
    // Calcular métricas de vendas baseadas em períodos reais
    const salesMetrics = this.calculateRealSalesMetrics(apiOrders);
    
    const totalItems = Object.values(wipByStage).reduce((a, b) => a + b, 0);
    const capacity = Math.max(250, totalItems * 1.2);
    
    // Contador de pedidos da semana: apenas pedidos em produção (Em aberto, Aprovado, Preparando envio, Faturado)
    // Se há filtro de data, usar apenas pedidos dentro do período
    let demand = 0;
    if (dateFilter && dateFilter.startDate && dateFilter.endDate) {
      // Filtrar pedidos por data E situação
      demand = apiOrders.filter(o => {
        const situacao = o.pedido.situacao;
        const dataPedido = o.pedido.data_pedido;
        
        // Verificar se está na situação correta
        const situacaoValida = ['Em aberto', 'Aprovado', 'Preparando envio', 'Faturado'].includes(situacao);
        if (!situacaoValida) return false;
        
        // Verificar se está dentro do período
        if (!dataPedido) return false;
        
        const dataPedidoObj = this.createLocalDate(dataPedido);
        if (!dataPedidoObj) return false;
        
        const startDate = new Date(dateFilter.startDate);
        const endDate = new Date(dateFilter.endDate);
        endDate.setHours(23, 59, 59, 999); // Incluir todo o dia final
        
        return dataPedidoObj >= startDate && dataPedidoObj <= endDate;
      }).length;
      
      console.log(`📊 Demand calculated with date filter: ${demand} pedidos (${dateFilter.startDate} até ${dateFilter.endDate})`);
    } else {
      // Sem filtro de data, usar todos os pedidos
      demand = apiOrders.filter(o => {
        const situacao = o.pedido.situacao;
        return ['Em aberto', 'Aprovado', 'Preparando envio', 'Faturado'].includes(situacao);
      }).length;
      
      console.log(`📊 Demand calculated without date filter: ${demand} pedidos`);
    }
    
    // Garantir que demand seja sempre um número
    if (typeof demand !== 'number' || isNaN(demand)) {
      demand = 0;
      console.log('⚠️ Demand was invalid, setting to 0');
    }

    // Calcular WIP Total usando data warehouse (prioridade) ou API (fallback)
    let itemsInProduction = 0; // Inicializar como 0
    let wipCalculationMethod = 'fallback';
    
    // Se há filtro de data, usar cálculo baseado em filtros
    if (dateFilter && dateFilter.startDate && dateFilter.endDate) {
      try {
        console.log('📅 Using date filter for WIP Total calculation...');
        const wipData = await this.calculateWIPTotalWithDateFilter(dateFilter.startDate, dateFilter.endDate);
        itemsInProduction = wipData.itemsInProduction;
        wipCalculationMethod = wipData.wipCalculationMethod;
        console.log(`✅ WIP Total with date filter: ${itemsInProduction} items`);
      } catch (dateFilterError) {
        console.warn('⚠️ Date filter calculation failed, using standard calculation:', dateFilterError.message);
        // Continuar com cálculo padrão
      }
    }
    
    // Se não há filtro de data ou falhou, usar cálculo padrão
    if (itemsInProduction === 0) {
      try {
        console.log('🏪 Attempting to get WIP Total from centralized service...');
        const warehouseWIPTotal = await pedidosCentralizedService.getWIPTotal();
        
        if (warehouseWIPTotal > 0) {
          itemsInProduction = warehouseWIPTotal;
          wipCalculationMethod = 'warehouse';
          console.log(`✅ Using data warehouse WIP Total: ${warehouseWIPTotal} items`);
        } else {
          console.log('⚠️ Data warehouse returned 0, trying API fallback');
          throw new Error('No data in warehouse, trying API fallback');
        }
      } catch (warehouseError) {
        console.warn('⚠️ Data warehouse not available, trying API fallback:', warehouseError.message);
        
        if (token) {
          try {
            console.log('🔍 Attempting to calculate real WIP Total from API...');
            console.log('🔑 Token available:', token ? 'YES' : 'NO');
            console.log('📊 API Orders count:', apiOrders.length);
            const realWIPTotal = await this.calculateWIPTotal(apiOrders, token);
            itemsInProduction = realWIPTotal;
            wipCalculationMethod = 'api';
            console.log(`✅ Using API WIP Total: ${realWIPTotal} items`);
          } catch (apiError) {
            console.warn('⚠️ API calculation failed, using fallback calculation:', apiError.message);
            // Fallback: usar contagem de pedidos ativos (não ideal, mas melhor que 0)
            const activeOrders = apiOrders.filter(o => {
              const situacao = o.pedido.situacao;
              return ['Em aberto', 'Aprovado', 'Preparando envio', 'Faturado'].includes(situacao);
            });
            itemsInProduction = activeOrders.length;
            wipCalculationMethod = 'fallback';
            console.log(`📊 Fallback WIP Total: ${itemsInProduction} items (based on order count)`);
          }
        } else {
          console.log('ℹ️ No token available, using fallback WIP calculation');
          // Fallback: usar contagem de pedidos ativos
          const activeOrders = apiOrders.filter(o => {
            const situacao = o.pedido.situacao;
            return ['Em aberto', 'Aprovado', 'Preparando envio', 'Faturado'].includes(situacao);
          });
          itemsInProduction = activeOrders.length;
          wipCalculationMethod = 'fallback';
          console.log(`📊 Fallback WIP Total: ${itemsInProduction} items (based on order count)`);
        }
      }
    }

    return {
      orders,
      productionData: {
        itemsSold: wipByStage['Em Aberto'],
        itemsInProduction: itemsInProduction,
        itemsProduced: wipByStage['Enviado'] + wipByStage['Faturado'],
        wipByStage,
        capacity,
        demand,
        preparandoEnvio,
        faturado,
        wipCalculationMethod,
      },
      salesMetrics,
      developmentData: {
        // Aprovar Arte = pedidos com situação "Em aberto"
        backlog: apiOrders.filter(o => {
          const situacao = o.pedido.situacao?.toLowerCase() || '';
          return situacao === 'em aberto' || situacao === 'em_aberto' || situacao === 'emaberto' || situacao === 'Em aberto';
        }).length,
        // Ajustar Arquivo = pedidos com situação "aprovado" 
        developedThisPeriod: apiOrders.filter(o => {
          const situacao = o.pedido.situacao?.toLowerCase() || '';
          return situacao === 'aprovado' || situacao === 'aprovado' || situacao === 'approved';
        }).length,
        // Projetos em andamento = todos os pedidos "Em aberto" e "aprovado" ordenados por prazo
        projects: orders
          .filter(o => {
            // Filtrar apenas situações específicas de desenvolvimento
            // Verificar variações possíveis na nomenclatura
            const situacao = o.situacao?.toLowerCase() || '';
            const isEmAberto = situacao === 'em aberto' || situacao === 'em_aberto' || situacao === 'emaberto' || situacao === 'Em aberto';
            const isAprovado = situacao === 'aprovado' || situacao === 'aprovado' || situacao === 'approved';
            
            const isDevelopmentSituation = isEmAberto || isAprovado;
            console.log(`🔍 Pedido ${o.order_id}: situacao="${o.situacao}" (${situacao}), isEmAberto=${isEmAberto}, isAprovado=${isAprovado}, isDevelopment=${isDevelopmentSituation}`);
            return isDevelopmentSituation;
          })
          .sort((a, b) => {
            // Ordenar por dias restantes (menos dias = mais crítico)
            return a.diasRestantes - b.diasRestantes;
          })
          .map((order, index) => ({
            id: order.id,
            name: `Pedido ${order.order_id} - ${order.customer}`,
            status: order.status === 'late' ? 'Atrasado' : 
                    order.status === 'risk' ? 'Em Risco' : 
                    order.status === 'on-time' ? 'No Prazo' : 
                    order.status === 'delivered' ? 'Entregue' : 
                    order.status === 'cancelled' ? 'Cancelado' : 
                    'Processando',
            deadline: order.promisedDate,
            diasRestantes: order.diasRestantes,
            situacao: order.situacao
          }))
          .map(project => {
            console.log(`📋 Projeto encontrado: ${project.name} - ${project.situacao} - ${project.status}`);
            return project;
          }),
        
        // Log final para debug
        totalProjectsFound: orders.filter(o => {
          const situacao = o.situacao?.toLowerCase() || '';
          const isEmAberto = situacao === 'em aberto' || situacao === 'em_aberto' || situacao === 'emaberto' || situacao === 'Em aberto';
          const isAprovado = situacao === 'aprovado' || situacao === 'aprovado' || situacao === 'approved';
          return isEmAberto || isAprovado;
        }).length,
      },
    };
  }

  // Calcular métricas de vendas baseadas em períodos reais
  calculateRealSalesMetrics(apiOrders) {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth() + 1; // getMonth() retorna 0-11
    const anoAtual = hoje.getFullYear();
    
    
    // Usar a função createLocalDate já existente
    
    // META DIÁRIA: Pedidos do mesmo dia
    const pedidosDiarios = apiOrders.filter(({ pedido }) => {
      if (!pedido.data_pedido) return false;
      
      const dataPedido = this.createLocalDate(pedido.data_pedido);
      if (!dataPedido) return false;
      
      const diaPedido = dataPedido.getDate();
      const mesPedido = dataPedido.getMonth() + 1;
      
      const isSameDay = diaPedido === diaAtual && mesPedido === mesAtual;
      
      if (isSameDay) {
      }
      
      return isSameDay;
    });
    
    const revenueDiario = pedidosDiarios.reduce((sum, { pedido }) => {
      const valor = parseFloat(pedido.valor || 0);
      return sum + valor;
    }, 0);
    
    // META SEMANAL: Pedidos da semana atual (domingo a sábado)
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo
    inicioSemana.setHours(0, 0, 0, 0);
    
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6); // Sábado
    fimSemana.setHours(23, 59, 59, 999);
    
    const pedidosSemanais = apiOrders.filter(({ pedido }) => {
      if (!pedido.data_pedido) return false;
      
      const dataPedido = this.createLocalDate(pedido.data_pedido);
      if (!dataPedido) return false;
      
      const isInWeek = dataPedido >= inicioSemana && dataPedido <= fimSemana;
      
      if (isInWeek) {
      }
      
      return isInWeek;
    });
    
    const revenueSemanal = pedidosSemanais.reduce((sum, { pedido }) => {
      const valor = parseFloat(pedido.valor || 0);
      return sum + valor;
    }, 0);
    
    // META MENSAL: Pedidos do mês atual
    const pedidosMensais = apiOrders.filter(({ pedido }) => {
      if (!pedido.data_pedido) return false;
      
      const dataPedido = this.createLocalDate(pedido.data_pedido);
      if (!dataPedido) return false;
      
      const mesPedido = dataPedido.getMonth() + 1;
      const anoPedido = dataPedido.getFullYear();
      
      const isSameMonth = mesPedido === mesAtual && anoPedido === anoAtual;
      
      if (isSameMonth) {
      }
      
      return isSameMonth;
    });
    
    const revenueMensal = pedidosMensais.reduce((sum, { pedido }) => {
      const valor = parseFloat(pedido.valor || 0);
      return sum + valor;
    }, 0);
    
    // Calcular metas baseadas em dados históricos
    const metaDiaria = Math.max(7000, revenueDiario * 1.2);
    const metaSemanal = Math.max(45000, revenueSemanal * 1.15);
    const metaMensal = Math.max(200000, revenueMensal * 1.1);
    
    // Debug final
    
    return {
      daily: { 
        current: revenueDiario, 
        goal: metaDiaria,
        previous: revenueDiario * 0.9
      },
      weekly: { 
        current: revenueSemanal, 
        goal: metaSemanal,
        previous: revenueSemanal * 0.9
      },
      monthly: { 
        current: revenueMensal, 
        goal: metaMensal,
        previous: revenueMensal * 0.9
      },
    };
  }

  // Calcular métricas de vendas (método antigo - mantido para compatibilidade)
  calculateSalesMetrics(orders) {
    const totalRevenue = orders.reduce((sum, order) => sum + order.valor, 0);
    
    return {
      totalRevenue,
      averageOrderValue: totalRevenue / orders.length || 0,
      totalOrders: orders.length
    };
  }

  // Filtrar pedidos por período
  filterOrdersByPeriod(orders, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdDate);
      return orderDate >= start && orderDate <= end;
    });
  }
}

// Exportar instância singleton
export const orderService = new OrderService();
export default orderService;
