import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreatePedidoDto, UpdatePedidoDto, UpdateNotificationsDto, GetOrdersQueryDto } from '../../common/dto/orders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pedidos com filtros opcionais' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos obtida com sucesso' })
  async findAll(@Query() query: GetOrdersQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter pedido por ID' })
  @ApiResponse({ status: 200, description: 'Pedido obtido com sucesso' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo pedido' })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso' })
  async create(@Body() createPedidoDto: CreatePedidoDto) {
    return this.ordersService.create(createPedidoDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar pedido' })
  @ApiResponse({ status: 200, description: 'Pedido atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async update(@Param('id') id: string, @Body() updatePedidoDto: UpdatePedidoDto) {
    return this.ordersService.update(id, updatePedidoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar pedido' })
  @ApiResponse({ status: 200, description: 'Pedido deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @Get('notifications/15-day')
  @ApiOperation({ summary: 'Obter pedidos para notificação de 15 dias' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos para notificação' })
  async getOrdersFor15DayNotification() {
    return this.ordersService.getOrdersFor15DayNotification();
  }

  @Get('notifications/45-day')
  @ApiOperation({ summary: 'Obter pedidos para notificação de 45 dias' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos para notificação' })
  async getOrdersFor45DayNotification() {
    return this.ordersService.getOrdersFor45DayNotification();
  }

  @Patch(':id/notifications')
  @ApiOperation({ summary: 'Atualizar status de notificação do pedido' })
  @ApiResponse({ status: 200, description: 'Notificações atualizadas com sucesso' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async updateNotifications(
    @Param('id') id: string,
    @Body() updateNotificationsDto: UpdateNotificationsDto
  ) {
    return this.ordersService.updateNotifications(id, updateNotificationsDto);
  }

  @Get('stats/dashboard')
  @ApiOperation({ summary: 'Obter estatísticas do dashboard' })
  @ApiResponse({ status: 200, description: 'Estatísticas obtidas com sucesso' })
  async getDashboardStats(@Query() query: GetOrdersQueryDto) {
    return this.ordersService.getDashboardStats(query);
  }
}
