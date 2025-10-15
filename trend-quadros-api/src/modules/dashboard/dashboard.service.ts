import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Pedido } from '../../database/entities/pedido.entity';
import { GetOrdersQueryDto } from '../../common/dto/orders.dto';
import { SalesGoalsService } from '../sales-goals/sales-goals.service';

export interface Alert15Days {
  id: number;
  pedido_id: string;
  customer: string;
  promisedDate: string;
  followUp15Date: string;
  daysSince15Day: number;
  envio_15: boolean;
  envio_45: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Alert45Days {
  id: number;
  pedido_id: string;
  customer: string;
  promisedDate: string;
  followUp45Date: string;
  daysSince45Day: number;
  envio_15: boolean;
  envio_45: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    private salesGoalsService: SalesGoalsService,
  ) {}

  // Função auxiliar para parsear datas do formato DD/MM/YYYY ou YYYY-MM-DD
  private parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    try {
      if (dateString.includes('/')) {
        // Formato DD/MM/YYYY
        const [day, month, year] = dateString.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (dateString.includes('-')) {
        // Formato YYYY-MM-DD
        return new Date(dateString);
      }
      return null;
    } catch {
      return null;
    }
  }

  async getOverviewData(query: GetOrdersQueryDto) {
    const queryBuilder = this.pedidoRepository.createQueryBuilder('pedido');

    if (query.dataInicial && query.dataFinal) {
      queryBuilder.andWhere('pedido.data_pedido BETWEEN :startDate AND :endDate', {
        startDate: query.dataInicial,
        endDate: query.dataFinal,
      });
    }

    const pedidos = await queryBuilder.getMany();

    const totalPedidos = pedidos.length;
    const pedidosAtivos = pedidos.filter(p => p.situacao !== 'Cancelado' && p.situacao !== 'Não Entregue').length;
    const receitaTotal = pedidos
      .filter(p => p.situacao !== 'Cancelado' && p.situacao !== 'Não Entregue')
      .reduce((sum, p) => sum + (parseFloat(p.valor_total?.toString() || '0') || 0), 0);
    const ticketMedio = pedidosAtivos > 0 ? receitaTotal / pedidosAtivos : 0;

    const breakdown = {
      emAberto: pedidos.filter(p => p.situacao === 'Em aberto').length,
      aprovado: pedidos.filter(p => p.situacao === 'Aprovado').length,
      preparandoEnvio: pedidos.filter(p => p.situacao === 'Preparando envio').length,
      faturado: pedidos.filter(p => p.situacao === 'Faturado').length,
      enviado: pedidos.filter(p => p.situacao === 'Enviado').length,
      entregue: pedidos.filter(p => p.situacao === 'Entregue').length,
      cancelado: pedidos.filter(p => p.situacao === 'Cancelado').length,
      naoEntregue: pedidos.filter(p => p.situacao === 'Não Entregue').length
    };

    const recentOrders = await this.pedidoRepository.find({
      order: { created_at: 'DESC' },
      take: 10
    });

    const productionData = {
      wip: {
        totalPedidos: breakdown.emAberto + breakdown.aprovado,
        pedidos: pedidos.filter(p => ['Em aberto', 'Aprovado'].includes(p.situacao))
      },
      wipByStage: {
        'Total Ativos': pedidosAtivos,
        'Em Desenvolvimento': breakdown.emAberto + breakdown.aprovado,
        'Em Produção': breakdown.preparandoEnvio + breakdown.faturado,
        'Preparando envio': breakdown.preparandoEnvio,
        'Faturado': breakdown.faturado,
        'Enviado': breakdown.enviado,
        'Entregue': breakdown.entregue,
        'Cancelado': breakdown.cancelado
      }
    };

    // Calcular dias restantes e status baseado na data prevista
    const calculateDaysRemaining = (dataPrevista: string) => {
      if (!dataPrevista) return null;
      const today = new Date();
      const prevista = this.parseDate(dataPrevista);
      if (!prevista) return null;
      
      const diffTime = prevista.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const calculateStatusBasedOnDate = (situacao: string, dataPrevista: string) => {
      if (situacao === 'Entregue') return 'delivered';
      if (situacao === 'Cancelado') return 'cancelled';
      
      const diasRestantes = calculateDaysRemaining(dataPrevista);
      if (diasRestantes === null) return 'on-time';
      
      if (diasRestantes < 0) return 'late';
      if (diasRestantes <= 1) return 'risk';
      return 'on-time';
    };

    const developmentData = {
      backlog: breakdown.emAberto,
      developedThisPeriod: breakdown.aprovado,
      projects: pedidos
        .filter(p => ['Em aberto', 'Aprovado'].includes(p.situacao))
        .map(pedido => {
          const diasRestantes = calculateDaysRemaining(pedido.data_prevista);
          const status = calculateStatusBasedOnDate(pedido.situacao, pedido.data_prevista);
          
          // Determinar status para exibição
          let statusDisplay = 'No Prazo';
          if (status === 'late') statusDisplay = 'Atrasado';
          else if (status === 'risk') statusDisplay = 'Em Risco';
          else if (status === 'delivered') statusDisplay = 'Entregue';
          else if (status === 'cancelled') statusDisplay = 'Cancelado';
          
          // Formatar data prevista corretamente
          let deadlineFormatted = 'Sem prazo';
          if (pedido.data_prevista) {
            // Se já está no formato DD/MM/YYYY, manter
            if (pedido.data_prevista.includes('/') && !pedido.data_prevista.startsWith('20')) {
              deadlineFormatted = pedido.data_prevista;
            } else if (pedido.data_prevista.includes('-')) {
              // Se está no formato YYYY-MM-DD, converter para DD/MM/YYYY
              const [year, month, day] = pedido.data_prevista.split('-');
              deadlineFormatted = `${day}/${month}/${year}`;
            } else {
              deadlineFormatted = pedido.data_prevista;
            }
          }
          
          return {
            id: pedido.id,
            name: `Pedido #${pedido.numero} - ${pedido.nome_cliente}`,
            status: statusDisplay,
            situacao: pedido.situacao,
            deadline: deadlineFormatted,
            diasRestantes: diasRestantes,
            valor: pedido.valor_total || 0
          };
        })
        .sort((a, b) => {
          // Ordenar por dias restantes (mais urgentes primeiro)
          if (a.diasRestantes === null && b.diasRestantes === null) return 0;
          if (a.diasRestantes === null) return 1;
          if (b.diasRestantes === null) return -1;
          return a.diasRestantes - b.diasRestantes;
        })
    };

    return {
      success: true,
      data: {
        totalPedidos,
        pedidosAtivos,
        receitaTotal,
        ticketMedio,
        breakdown,
        recentOrders,
        productionData,
        developmentData
      }
    };
  }

  async getSalesData(query: GetOrdersQueryDto) {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    const todayStr = formatDate(today);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Calcular períodos anteriores para comparação
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(weekAgo);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(startOfMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Buscar dados do período atual
    const dailyOrders = await this.pedidoRepository.find({
      where: {
        data_pedido: Between(new Date(todayStr), new Date(todayStr))
      }
    });

    const weeklyOrders = await this.pedidoRepository.find({
      where: {
        data_pedido: Between(new Date(formatDate(weekAgo)), new Date(todayStr))
      }
    });

    const monthlyOrders = await this.pedidoRepository.find({
      where: {
        data_pedido: Between(new Date(formatDate(startOfMonth)), new Date(todayStr))
      }
    });

    // Buscar dados do período anterior para comparação
    const yesterdayOrders = await this.pedidoRepository.find({
      where: {
        data_pedido: Between(new Date(formatDate(yesterday)), new Date(formatDate(yesterday)))
      }
    });

    const lastWeekOrders = await this.pedidoRepository.find({
      where: {
        data_pedido: Between(new Date(formatDate(lastWeek)), new Date(formatDate(weekAgo)))
      }
    });

    const lastMonthOrders = await this.pedidoRepository.find({
      where: {
        data_pedido: Between(new Date(formatDate(lastMonth)), new Date(formatDate(startOfMonth)))
      }
    });

    // Calcular receitas
    const dailyRevenue = dailyOrders.reduce((sum, order) => sum + (order.valor_total || 0), 0);
    const weeklyRevenue = weeklyOrders.reduce((sum, order) => sum + (order.valor_total || 0), 0);
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (order.valor_total || 0), 0);

    const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + (order.valor_total || 0), 0);
    const lastWeekRevenue = lastWeekOrders.reduce((sum, order) => sum + (order.valor_total || 0), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + (order.valor_total || 0), 0);

    // Buscar metas do banco de dados
    const goals = await this.salesGoalsService.getCurrentGoals();

    return {
      success: true,
      data: {
        daily: {
          current: dailyRevenue,
          previous: yesterdayRevenue,
          goal: goals.daily_goal,
          orders: dailyOrders.length,
          period: todayStr,
          growth: yesterdayRevenue > 0 ? ((dailyRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0
        },
        weekly: {
          current: weeklyRevenue,
          previous: lastWeekRevenue,
          goal: goals.weekly_goal,
          orders: weeklyOrders.length,
          period: `${formatDate(weekAgo)} - ${todayStr}`,
          growth: lastWeekRevenue > 0 ? ((weeklyRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0
        },
        monthly: {
          current: monthlyRevenue,
          previous: lastMonthRevenue,
          goal: goals.monthly_goal,
          orders: monthlyOrders.length,
          period: `${formatDate(startOfMonth)} - ${todayStr}`,
          growth: lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0
        }
      }
    };
  }

  async getProductionData(query: GetOrdersQueryDto) {
    const queryBuilder = this.pedidoRepository.createQueryBuilder('pedido');

    if (query.dataInicial && query.dataFinal) {
      queryBuilder.andWhere('pedido.data_pedido BETWEEN :startDate AND :endDate', {
        startDate: query.dataInicial,
        endDate: query.dataFinal,
      });
    }

    const pedidos = await queryBuilder.getMany();

    const situacoesProducao = ['Em aberto', 'Aprovado', 'Preparando envio', 'Faturado'];
    const wipPedidos = pedidos.filter(order => situacoesProducao.includes(order.situacao));
    
    const wipTotal = wipPedidos.reduce((sum, order) => {
      if (order.itens_json && Array.isArray(order.itens_json)) {
        return sum + order.itens_json.reduce((itemSum, item) => {
          const quantidade = parseFloat(item.quantidade || item.item?.quantidade || 0);
          return itemSum + quantidade;
        }, 0);
      }
      return sum;
    }, 0);

    const situacoesItensProducao = ['Preparando envio', 'Faturado'];
    const itensProducaoPedidos = pedidos.filter(order => situacoesItensProducao.includes(order.situacao));
    
    const itemsInProduction = itensProducaoPedidos.reduce((sum, order) => {
      if (order.itens_json && Array.isArray(order.itens_json)) {
        return sum + order.itens_json.reduce((itemSum, item) => {
          const quantidade = parseFloat(item.quantidade || item.item?.quantidade || 0);
          return itemSum + quantidade;
        }, 0);
      }
      return sum;
    }, 0);

    return {
      success: true,
      data: {
        wip: {
          totalItens: wipTotal,
          totalPedidos: wipPedidos.length,
          pedidos: wipPedidos
        },
        itemsInProduction,
        capacity: 1000,
        demand: wipPedidos.length,
        preparandoEnvio: pedidos.filter(o => o.situacao === 'Preparando envio').length,
        faturado: pedidos.filter(o => o.situacao === 'Faturado').length
      }
    };
  }

  async getAfterSalesData(query: GetOrdersQueryDto) {
    const queryBuilder = this.pedidoRepository.createQueryBuilder('pedido');

    if (query.dataInicial && query.dataFinal) {
      queryBuilder.andWhere('pedido.data_pedido BETWEEN :startDate AND :endDate', {
        startDate: query.dataInicial,
        endDate: query.dataFinal,
      });
    }

    const pedidos = await queryBuilder.getMany();

    const afterSalesOrders = pedidos.filter(order => 
      ['Entregue', 'Não Entregue', 'Enviado'].includes(order.situacao)
    );

    // Calcular alertas de 15 e 45 dias
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);

    const alerts15Days: Alert15Days[] = [];
    const alerts45Days: Alert45Days[] = [];

    const processedOrders = afterSalesOrders.map(order => {
      let diasRestantes: number | undefined = undefined;
      if (order.data_prevista) {
        const parsedDate = this.parseDate(order.data_prevista);
        if (parsedDate) {
          diasRestantes = Math.ceil((parsedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      let status = 'processing';
      if (order.situacao === 'Entregue') status = 'delivered';
      else if (order.situacao === 'Não Entregue') status = 'not-delivered';
      else if (order.situacao === 'Enviado') status = 'shipped';
      else if (diasRestantes !== undefined) {
        if (diasRestantes <= 1) status = 'late';
        else if (diasRestantes <= 5) status = 'risk';
        else status = 'on-time';
      }

      // Verificar alertas de 15 dias
      if (order.data_prevista) {
        const promisedDate = this.parseDate(order.data_prevista);
        if (!promisedDate) return { ...order, status: 'processing', diasRestantes: undefined };
        const followUp15Date = new Date(promisedDate.getTime() + 15 * 24 * 60 * 60 * 1000);
        const followUp45Date = new Date(promisedDate.getTime() + 45 * 24 * 60 * 60 * 1000);
        
        const daysSince15Day = Math.floor((now.getTime() - followUp15Date.getTime()) / (1000 * 60 * 60 * 24));
        const daysSince45Day = Math.floor((now.getTime() - followUp45Date.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSince15Day >= 0 && !order.envio_15) {
          alerts15Days.push({
            id: order.id,
            pedido_id: order.pedido_id,
            customer: order.nome_cliente,
            promisedDate: order.data_prevista,
            followUp15Date: followUp15Date.toLocaleDateString('pt-BR'),
            daysSince15Day: daysSince15Day,
            envio_15: order.envio_15,
            envio_45: order.envio_45,
            created_at: order.created_at,
            updated_at: order.updated_at
          });
        }
        
        if (daysSince45Day >= 0 && !order.envio_45) {
          alerts45Days.push({
            id: order.id,
            pedido_id: order.pedido_id,
            customer: order.nome_cliente,
            promisedDate: order.data_prevista,
            followUp45Date: followUp45Date.toLocaleDateString('pt-BR'),
            daysSince45Day: daysSince45Day,
            envio_15: order.envio_15,
            envio_45: order.envio_45,
            created_at: order.created_at,
            updated_at: order.updated_at
          });
        }
      }

      return {
        ...order,
        status,
        diasRestantes,
        willBeLate: diasRestantes !== undefined && diasRestantes <= 1 && diasRestantes >= 0,
        deliveryDate: order.situacao === 'Entregue' ? this.parseDate(order.data_prevista) : null,
        promisedDate: order.data_prevista ? this.parseDate(order.data_prevista) : null,
        order_id: order.numero || order.id,
        customer: order.nome_cliente,
        items: Array.isArray(order.itens_json) ? order.itens_json.map((item, index) => ({
          id: item.id || index,
          sku: item.sku || item.codigo || 'N/A',
          title: item.descricao || item.nome || item.titulo || 'Item sem descrição',
          stage: item.etapa || item.stage || 'Pendente',
          stage_eta_at: item.data_prevista || item.eta || null,
          quantidade: item.quantidade || 1,
          valor: item.valor || 0
        })) : []
      };
    });

    // Ordenar alertas por urgência
    alerts15Days.sort((a, b) => b.daysSince15Day - a.daysSince15Day);
    alerts45Days.sort((a, b) => b.daysSince45Day - a.daysSince45Day);

    return {
      success: true,
      data: {
        orders: processedOrders,
        alerts: {
          fifteenDays: alerts15Days,
          fortyFiveDays: alerts45Days,
          total15DayAlerts: alerts15Days.length,
          total45DayAlerts: alerts45Days.length
        }
      }
    };
  }
}
