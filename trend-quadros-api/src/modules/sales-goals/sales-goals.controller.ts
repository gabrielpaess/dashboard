import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SalesGoalsService } from './sales-goals.service';
import { UpdateSalesGoalsDto, SalesGoalsResponseDto } from '../../common/dto/sales-goals.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Sales Goals')
@Controller('sales-goals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalesGoalsController {
  constructor(private readonly salesGoalsService: SalesGoalsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obter metas atuais de vendas' })
  @ApiResponse({ 
    status: 200, 
    description: 'Metas obtidas com sucesso',
    type: SalesGoalsResponseDto
  })
  async getCurrentGoals(): Promise<{ success: boolean; data: any }> {
    try {
      const goals = await this.salesGoalsService.getCurrentGoals();
      return {
        success: true,
        data: goals
      };
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      return {
        success: false,
        data: {
          daily_goal: 7000.00,
          weekly_goal: 45000.00,
          monthly_goal: 200000.00,
          created_at: new Date(),
          updated_at: new Date()
        }
      };
    }
  }

  @Post()
  @ApiOperation({ summary: 'Atualizar metas de vendas (apenas admin)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Metas atualizadas com sucesso',
    type: SalesGoalsResponseDto
  })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas administradores' })
  async updateGoals(
    @Body() updateDto: UpdateSalesGoalsDto,
    @Request() req: any
  ): Promise<{ success: boolean; data: SalesGoalsResponseDto }> {
    try {
      console.log('🔍 Controller - Dados recebidos:', updateDto);
      console.log('🔍 Controller - Usuário:', req.user);
      
      // Verificar se o usuário é admin
      if (req.user?.nivel !== 'admin') {
        console.log('❌ Controller - Acesso negado. Usuário não é admin:', req.user?.nivel);
        throw new Error('Acesso negado. Apenas administradores podem alterar as metas.');
      }

      // Validar se os dados foram recebidos corretamente
      if (!updateDto.daily_goal || !updateDto.weekly_goal || !updateDto.monthly_goal) {
        console.log('❌ Controller - Dados incompletos:', updateDto);
        throw new Error('Dados incompletos. Todas as metas devem ser fornecidas.');
      }

      const goals = await this.salesGoalsService.updateGoals(updateDto, req.user.id);
      console.log('✅ Controller - Metas atualizadas com sucesso:', goals);
      
      return {
        success: true,
        data: goals
      };
    } catch (error) {
      console.error('❌ Controller - Erro ao atualizar metas:', error);
      throw error;
    }
  }

  @Get('history')
  @ApiOperation({ summary: 'Obter histórico de metas (apenas admin)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Histórico obtido com sucesso',
    type: [SalesGoalsResponseDto]
  })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas administradores' })
  async getGoalsHistory(@Request() req: any): Promise<{ success: boolean; data: SalesGoalsResponseDto[] }> {
    // Verificar se o usuário é admin
    if (req.user?.nivel !== 'admin') {
      throw new Error('Acesso negado. Apenas administradores podem ver o histórico.');
    }

    const history = await this.salesGoalsService.getGoalsHistory();
    return {
      success: true,
      data: history
    };
  }
}
