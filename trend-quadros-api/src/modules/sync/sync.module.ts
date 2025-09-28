import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { TinyApiService } from './tiny-api.service';
import { Pedido } from '../../database/entities/pedido.entity';
import { RateLimiterService } from '../../common/services/rate-limiter.service';
import { ContinuousSyncService } from './continuous-sync.service';
import { SyncController as NewSyncController } from './sync-controller';
import { SyncBootstrapService } from './sync-bootstrap.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido]),
    ScheduleModule.forRoot()
  ],
  controllers: [SyncController, NewSyncController],
  providers: [SyncService, TinyApiService, RateLimiterService, ContinuousSyncService, SyncBootstrapService],
  exports: [SyncService, TinyApiService, RateLimiterService, ContinuousSyncService],
})
export class SyncModule {}
