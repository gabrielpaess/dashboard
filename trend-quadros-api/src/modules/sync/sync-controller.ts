import { Controller, Get, Post, Delete, Logger } from '@nestjs/common';
import { ContinuousSyncService } from './continuous-sync.service';
import { TinyApiService } from './tiny-api.service';
import { RateLimiterService } from '../../common/services/rate-limiter.service';

@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(
    private continuousSyncService: ContinuousSyncService,
    private tinyApiService: TinyApiService,
    private rateLimiter: RateLimiterService
  ) {}

  /**
   * Inicia a sincronização contínua
   */
  @Post('start')
  startSync() {
    try {
      this.continuousSyncService.startContinuousSync();
      return {
        success: true,
        message: 'Continuous sync started successfully',
        status: this.continuousSyncService.getStatus()
      };
    } catch (error) {
      this.logger.error('Error starting sync:', error.message);
      return {
        success: false,
        message: 'Failed to start continuous sync',
        error: error.message
      };
    }
  }

  /**
   * Para a sincronização contínua
   */
  @Post('stop')
  stopSync() {
    try {
      this.continuousSyncService.stopContinuousSync();
      return {
        success: true,
        message: 'Continuous sync stopped successfully',
        status: this.continuousSyncService.getStatus()
      };
    } catch (error) {
      this.logger.error('Error stopping sync:', error.message);
      return {
        success: false,
        message: 'Failed to stop continuous sync',
        error: error.message
      };
    }
  }

  /**
   * Executa uma sincronização manual
   */
  @Post('execute')
  async executeSync() {
    try {
      await this.continuousSyncService.executeSync();
      return {
        success: true,
        message: 'Manual sync executed successfully',
        status: this.continuousSyncService.getStatus()
      };
    } catch (error) {
      this.logger.error('Error executing sync:', error.message);
      return {
        success: false,
        message: 'Failed to execute manual sync',
        error: error.message
      };
    }
  }

  /**
   * Obtém status da sincronização
   */
  @Get('status')
  getStatus() {
    try {
      const status = this.continuousSyncService.getStatus();
      const rateLimitStats = this.rateLimiter.getStats();
      
      return {
        success: true,
        sync: status,
        rateLimiter: rateLimitStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error getting status:', error.message);
      return {
        success: false,
        message: 'Failed to get status',
        error: error.message
      };
    }
  }

  /**
   * Testa conexão com Tiny API
   */
  @Get('test-tiny')
  async testTinyApi() {
    try {
      const isValid = await this.tinyApiService.validateToken();
      const rateLimitStats = this.rateLimiter.getStats();
      
      return {
        success: true,
        tinyApi: {
          connected: isValid,
          token: process.env.TINY_API_TOKEN ? 'Set' : 'Not set'
        },
        rateLimiter: rateLimitStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error testing Tiny API:', error.message);
      return {
        success: false,
        message: 'Failed to test Tiny API connection',
        error: error.message
      };
    }
  }

  /**
   * Reseta o rate limiter
   */
  @Post('reset-rate-limit')
  resetRateLimit() {
    try {
      this.rateLimiter.reset();
      return {
        success: true,
        message: 'Rate limiter reset successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error resetting rate limiter:', error.message);
      return {
        success: false,
        message: 'Failed to reset rate limiter',
        error: error.message
      };
    }
  }
}
