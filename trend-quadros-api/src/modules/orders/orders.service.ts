import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Pedido } from '../../database/entities/pedido.entity';
import { CreatePedidoDto, UpdatePedidoDto, UpdateNotificationsDto, GetOrdersQueryDto } from '../../common/dto/orders.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
  ) {}

  async findAll(query: GetOrdersQueryDto) {
    const queryBuilder = this.pedidoRepository.createQueryBuilder('pedido');

    if (query.dataInicial && query.dataFinal) {
      queryBuilder.andWhere('pedido.data_pedido BETWEEN :startDate AND :endDate', {
        startDate: query.dataInicial,
        endDate: query.dataFinal,
      });
    }

    if (query.situacao) {
      queryBuilder.andWhere('pedido.situacao = :situacao', { situacao: query.situacao });
    }

    if (query.nome_vendedor) {
      queryBuilder.andWhere('pedido.nome_vendedor ILIKE :nome_vendedor', { 
        nome_vendedor: `%${query.nome_vendedor}%` 
      });
    }

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    queryBuilder.orderBy('pedido.created_at', 'DESC');

    const [pedidos, total] = await queryBuilder.getManyAndCount();

    return {
      success: true,
      data: pedidos,
      count: total
    };
  }

  async findOne(id: string) {
    const pedido = await this.pedidoRepository.findOne({
      where: { pedido_id: id }
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return {
      success: true,
      data: pedido
    };
  }

  async create(createPedidoDto: CreatePedidoDto) {
    const pedido = this.pedidoRepository.create(createPedidoDto);
    const savedPedido = await this.pedidoRepository.save(pedido);

    return {
      success: true,
      data: savedPedido
    };
  }

  async update(id: string, updatePedidoDto: UpdatePedidoDto) {
    const pedido = await this.pedidoRepository.findOne({
      where: { pedido_id: id }
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    Object.assign(pedido, updatePedidoDto);
    const savedPedido = await this.pedidoRepository.save(pedido);

    return {
      success: true,
      data: savedPedido
    };
  }

  async remove(id: string) {
    const pedido = await this.pedidoRepository.findOne({
      where: { pedido_id: id }
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    await this.pedidoRepository.remove(pedido);

    return {
      success: true,
      data: pedido
    };
  }

  async getOrdersFor15DayNotification() {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const orders = await this.pedidoRepository.find({
      where: {
        envio_15: false,
        created_at: Between(new Date('1900-01-01'), fifteenDaysAgo)
      },
      order: { created_at: 'ASC' }
    });

    return {
      success: true,
      data: orders,
      count: orders.length
    };
  }

  async getOrdersFor45DayNotification() {
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    const orders = await this.pedidoRepository.find({
      where: {
        envio_45: false,
        created_at: Between(new Date('1900-01-01'), fortyFiveDaysAgo)
      },
      order: { created_at: 'ASC' }
    });

    return {
      success: true,
      data: orders,
      count: orders.length
    };
  }

  async updateNotifications(id: string, updateNotificationsDto: UpdateNotificationsDto) {
    const pedido = await this.pedidoRepository.findOne({
      where: { pedido_id: id }
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    Object.assign(pedido, updateNotificationsDto);
    const savedPedido = await this.pedidoRepository.save(pedido);

    return {
      success: true,
      data: savedPedido
    };
  }

  async getDashboardStats(query: GetOrdersQueryDto) {
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
      .reduce((sum, p) => sum + (p.valor_total || 0), 0);
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

    return {
      success: true,
      data: {
        totalPedidos,
        pedidosAtivos,
        receitaTotal,
        ticketMedio,
        breakdown
      }
    };
  }
}
