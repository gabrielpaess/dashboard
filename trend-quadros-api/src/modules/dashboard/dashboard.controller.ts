import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { GetOrdersQueryDto } from '../../common/dto/orders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @Public()
  @ApiOperation({ summary: 'Obter dados gerais do dashboard' })
  @ApiResponse({ status: 200, description: 'Dados obtidos com sucesso' })
  async getOverview(@Query() query: GetOrdersQueryDto) {
    const data = await this.dashboardService.getOverviewData(query);
    return {
      success: true,
      data: data
    };
  }

  @Get('sales')
  @Public()
  @ApiOperation({ summary: 'Obter dados de vendas' })
  @ApiResponse({ status: 200, description: 'Dados de vendas obtidos com sucesso' })
  async getSales(@Query() query: GetOrdersQueryDto) {
    return this.dashboardService.getSalesData(query);
  }

  @Get('production')
  @Public()
  @ApiOperation({ summary: 'Obter dados de produção' })
  @ApiResponse({ status: 200, description: 'Dados de produção obtidos com sucesso' })
  async getProduction(@Query() query: GetOrdersQueryDto) {
    return this.dashboardService.getProductionData(query);
  }

  @Get('after-sales')
  @Public()
  @ApiOperation({ summary: 'Obter dados de pós-venda' })
  @ApiResponse({ status: 200, description: 'Dados de pós-venda obtidos com sucesso' })
  async getAfterSales(@Query() query: GetOrdersQueryDto) {
    return this.dashboardService.getAfterSalesData(query);
  }
}
