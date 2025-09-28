import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('full')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Executar sincronização completa' })
  @ApiResponse({ status: 200, description: 'Sincronização executada com sucesso' })
  @ApiResponse({ status: 500, description: 'Erro na sincronização' })
  async executeFullSync(@Body() options: any = {}) {
    return this.syncService.executeFullSync(options);
  }

  @Post('incremental')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Executar sincronização incremental' })
  @ApiResponse({ status: 200, description: 'Sincronização executada com sucesso' })
  @ApiResponse({ status: 500, description: 'Erro na sincronização' })
  async executeIncrementalSync(@Body() options: any = {}) {
    return this.syncService.executeIncrementalSync(options);
  }

  @Get('status')
  @ApiOperation({ summary: 'Obter status da sincronização' })
  @ApiResponse({ status: 200, description: 'Status obtido com sucesso' })
  async getSyncStatus() {
    return {
      success: true,
      data: this.syncService.getSyncStatus()
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas de sincronização' })
  @ApiResponse({ status: 200, description: 'Estatísticas obtidas com sucesso' })
  async getSyncStats() {
    return {
      success: true,
      data: this.syncService.getSyncStats()
    };
  }
}
