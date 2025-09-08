// Service para processar dados dos pedidos
class OrderService {
  // Processar dados dos pedidos da API para o dashboard
  processOrderData(apiOrders) {
    console.log('🔄 OrderService - Processando dados:', apiOrders.length, 'pedidos');
    
    // Debug: Mostrar todas as situações únicas que estão vindo da API
    const situacoesUnicas = [...new Set(apiOrders.map(o => o.pedido.situacao))];
    console.log('📊 Situações encontradas na API:', situacoesUnicas);
    
    // Debug: Contar pedidos por situação
    const contagemPorSituacao = situacoesUnicas.reduce((acc, situacao) => {
      acc[situacao] = apiOrders.filter(o => o.pedido.situacao === situacao).length;
      return acc;
    }, {});
    console.log('📈 Contagem por situação:', contagemPorSituacao);
    
    const orders = apiOrders.map(({ pedido }) => {
      const createdDate = new Date(pedido.data_pedido.split('/').reverse().join('-'));
      const promisedDate = pedido.data_prevista ? new Date(pedido.data_prevista.split('/').reverse().join('-')) : new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Sistema inteligente de status de entrega (SLA)
      let status = 'on-time';
      let willBeLate = false;
      let riskReason = null;
      
      // Calcular dias restantes para entrega
      const hoje = new Date();
      const diasRestantes = Math.ceil((promisedDate - hoje) / (1000 * 60 * 60 * 24));
      
      if (pedido.situacao === 'Entregue') {
        status = 'delivered';
      } else if (pedido.situacao === 'Cancelado') {
        status = 'cancelled';
        riskReason = 'Pedido cancelado';
      } else if (pedido.situacao === 'Enviado') {
        status = 'shipped';
        // Se enviado mas passou do prazo, considerar atrasado
        if (diasRestantes < 0) {
          status = 'late';
          willBeLate = true;
          riskReason = 'Enviado mas atrasado';
        }
      } else if (pedido.situacao === 'Faturado') {
        status = 'invoiced';
        // Se faturado mas próximo do prazo, considerar em risco
        if (diasRestantes <= 1) {
          status = 'risk';
          willBeLate = true;
          riskReason = 'Faturado mas próximo do prazo';
        }
      } else if (pedido.situacao === 'Preparando envio' || pedido.situacao === 'Pronto para envio') {
        // Lógica inteligente baseada em dias restantes
        if (diasRestantes < 0) {
          status = 'late';
          willBeLate = true;
          riskReason = 'Atrasado na preparação';
        } else if (diasRestantes <= 2) {
          status = 'risk';
          willBeLate = true;
          riskReason = 'Em risco - preparando envio';
        } else {
          status = 'on-time';
        }
      } else if (pedido.situacao === 'Em aberto') {
        // Lógica inteligente para pedidos em aberto
        if (diasRestantes < 0) {
          status = 'late';
          willBeLate = true;
          riskReason = 'Atrasado - ainda em aberto';
        } else if (diasRestantes <= 3) {
          status = 'risk';
          willBeLate = true;
          riskReason = 'Em risco - pedido em aberto';
        } else {
          status = 'on-time';
        }
      } else if (pedido.situacao === 'aprovado') {
        // Lógica para pedidos aprovados
        if (diasRestantes < 0) {
          status = 'late';
          willBeLate = true;
          riskReason = 'Atrasado - aprovado mas não processado';
        } else if (diasRestantes <= 2) {
          status = 'risk';
          willBeLate = true;
          riskReason = 'Em risco - aprovado recentemente';
        } else {
          status = 'on-time';
        }
      } else {
        // Situação não mapeada - aplicar lógica de data
        if (diasRestantes < 0) {
          status = 'late';
          willBeLate = true;
          riskReason = 'Atrasado na entrega';
        } else if (diasRestantes <= 2) {
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
          (pedido.data_prevista ? new Date(pedido.data_prevista.split('/').reverse().join('-')) : 
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
        slaPriority: diasRestantes < 0 ? 'critical' : diasRestantes <= 2 ? 'high' : diasRestantes <= 5 ? 'medium' : 'low',
        items: [{
          id: pedido.id + '-1',
          sku: pedido.numero_ecommerce || `PED-${pedido.numero}`,
          title: 'Quadro Personalizado',
          stage: pedido.situacao,
          stage_eta_at: promisedDate
        }]
      };
    }).sort((a, b) => parseInt(a.id) - parseInt(b.id));

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
    };
    
    // Debug: Mostrar contagem dos estágios mapeados
    console.log('🎯 Contagem dos estágios mapeados:', {
      'Vendido': wipByStage['Vendido'],
      'Em Produção': wipByStage['Em Produção'],
      'Em Desenvolvimento': wipByStage['Em Desenvolvimento']
    });
    
    // Debug: Mostrar dados específicos de desenvolvimento
    const pedidosAprovados = apiOrders.filter(o => o.pedido.situacao === 'aprovado');
    console.log('🔧 Dados de Desenvolvimento:', {
      'Aprovados (desenvolvidos)': pedidosAprovados.length,
      'Em aberto (backlog)': wipByStage['Em Aberto'],
      'Exemplos de pedidos aprovados': pedidosAprovados.slice(0, 3).map(p => ({
        id: p.pedido.id,
        numero: p.pedido.numero,
        situacao: p.pedido.situacao
      }))
    });
    
    // Debug: Mostrar status de SLA calculados
    const statusSLA = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Status de SLA Calculados:', statusSLA);
    
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
    console.log('🎯 Exemplos por Status SLA:', exemplosPorStatus);
    
    // Validação: Verificar se a soma dos estágios principais bate com o total
    const totalMapeado = wipByStage['Vendido'] + wipByStage['Em Produção'] + wipByStage['Em Desenvolvimento'];
    const totalOriginal = apiOrders.length;
    console.log('✅ Validação de contagem:', {
      totalMapeado,
      totalOriginal,
      diferenca: totalOriginal - totalMapeado,
      situacoesNaoMapeadas: situacoesUnicas.filter(s => 
        s !== 'Em aberto' && 
        s !== 'aprovado' &&
        s !== 'Preparando envio' && 
        s !== 'Pronto para envio' && 
        s !== 'Faturado' &&
        s !== 'Enviado' &&
        s !== 'Entregue' &&
        s !== 'Cancelado'
      )
    });

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
    const demand = totalItems;

    return {
      orders,
      productionData: {
        itemsSold: wipByStage['Em Aberto'],
        itemsInProduction: wipByStage['Preparando Envio'] + wipByStage['Pronto para Envio'],
        itemsProduced: wipByStage['Enviado'] + wipByStage['Faturado'],
        wipByStage,
        capacity,
        demand,
        preparandoEnvio,
        faturado,
      },
      salesMetrics,
      developmentData: {
        backlog: wipByStage['Em Aberto'],
        // Corrigido: Mostrar apenas pedidos com situação "aprovado"
        developedThisPeriod: apiOrders.filter(o => o.pedido.situacao === 'aprovado').length,
        projects: orders
          .filter(o => o.status === 'at-risk' || o.status === 'late' || o.status === 'open')
          .sort((a, b) => parseInt(a.id) - parseInt(b.id))
          .slice(0, 5)
          .map((order, index) => ({
            id: order.id,
            name: `Pedido ${order.order_id} - ${order.customer}`,
            status: order.status === 'late' ? 'Em Risco' : order.status === 'open' ? 'Em Aberto' : 'No Prazo',
            deadline: order.promisedDate.toISOString().split('T')[0]
          })),
      },
    };
  }

  // Calcular métricas de vendas baseadas em períodos reais
  calculateRealSalesMetrics(apiOrders) {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth() + 1; // getMonth() retorna 0-11
    const anoAtual = hoje.getFullYear();
    
    console.log('📅 DATA DE CONSULTA:', {
      hoje: `${diaAtual}/${mesAtual}/${anoAtual}`,
      dia: diaAtual,
      mes: mesAtual,
      ano: anoAtual
    });
    
    // Função auxiliar para converter data_pedido para Date
    const parseDataPedido = (dataPedido) => {
      try {
        // Formato: DD/MM/YYYY
        const [dia, mes, ano] = dataPedido.split('/');
        return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      } catch (error) {
        console.error('Erro ao converter data_pedido:', dataPedido, error);
        return null;
      }
    };
    
    // META DIÁRIA: Pedidos do mesmo dia
    console.log('🔍 META DIÁRIA - Buscando pedidos do dia:', diaAtual);
    const pedidosDiarios = apiOrders.filter(({ pedido }) => {
      if (!pedido.data_pedido) return false;
      
      const dataPedido = parseDataPedido(pedido.data_pedido);
      if (!dataPedido) return false;
      
      const diaPedido = dataPedido.getDate();
      const mesPedido = dataPedido.getMonth() + 1;
      
      const isSameDay = diaPedido === diaAtual && mesPedido === mesAtual;
      
      if (isSameDay) {
        console.log('✅ PEDIDO DIÁRIO ENCONTRADO:', {
          id: pedido.id,
          data_pedido: pedido.data_pedido,
          valor: pedido.valor,
          diaPedido,
          mesPedido
        });
      }
      
      return isSameDay;
    });
    
    const revenueDiario = pedidosDiarios.reduce((sum, { pedido }) => {
      const valor = parseFloat(pedido.valor || 0);
      console.log('💰 SOMANDO DIÁRIO:', {
        id: pedido.id,
        valor: valor,
        somaAnterior: sum,
        novaSoma: sum + valor
      });
      return sum + valor;
    }, 0);
    
    // META SEMANAL: Pedidos da semana atual (domingo a sábado)
    console.log('🔍 META SEMANAL - Buscando pedidos da semana');
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo
    inicioSemana.setHours(0, 0, 0, 0);
    
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6); // Sábado
    fimSemana.setHours(23, 59, 59, 999);
    
    const pedidosSemanais = apiOrders.filter(({ pedido }) => {
      if (!pedido.data_pedido) return false;
      
      const dataPedido = parseDataPedido(pedido.data_pedido);
      if (!dataPedido) return false;
      
      const isInWeek = dataPedido >= inicioSemana && dataPedido <= fimSemana;
      
      if (isInWeek) {
        console.log('✅ PEDIDO SEMANAL ENCONTRADO:', {
          id: pedido.id,
          data_pedido: pedido.data_pedido,
          valor: pedido.valor,
          dataConvertida: dataPedido.toISOString().split('T')[0]
        });
      }
      
      return isInWeek;
    });
    
    const revenueSemanal = pedidosSemanais.reduce((sum, { pedido }) => {
      const valor = parseFloat(pedido.valor || 0);
      return sum + valor;
    }, 0);
    
    // META MENSAL: Pedidos do mês atual
    console.log('🔍 META MENSAL - Buscando pedidos do mês:', mesAtual);
    const pedidosMensais = apiOrders.filter(({ pedido }) => {
      if (!pedido.data_pedido) return false;
      
      const dataPedido = parseDataPedido(pedido.data_pedido);
      if (!dataPedido) return false;
      
      const mesPedido = dataPedido.getMonth() + 1;
      const anoPedido = dataPedido.getFullYear();
      
      const isSameMonth = mesPedido === mesAtual && anoPedido === anoAtual;
      
      if (isSameMonth) {
        console.log('✅ PEDIDO MENSAL ENCONTRADO:', {
          id: pedido.id,
          data_pedido: pedido.data_pedido,
          valor: pedido.valor,
          mesPedido,
          anoPedido
        });
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
    console.log('📊 RESULTADO FINAL DAS METAS:', {
      diario: {
        pedidos: pedidosDiarios.length,
        revenue: revenueDiario,
        meta: metaDiaria,
        pedidosDetalhes: pedidosDiarios.map(p => ({
          id: p.pedido.id,
          data_pedido: p.pedido.data_pedido,
          valor: p.pedido.valor
        }))
      },
      semanal: {
        pedidos: pedidosSemanais.length,
        revenue: revenueSemanal,
        meta: metaSemanal,
        periodo: `${inicioSemana.toISOString().split('T')[0]} a ${fimSemana.toISOString().split('T')[0]}`
      },
      mensal: {
        pedidos: pedidosMensais.length,
        revenue: revenueMensal,
        meta: metaMensal,
        mes: mesAtual
      }
    });
    
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
