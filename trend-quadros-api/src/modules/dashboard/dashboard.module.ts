import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Pedido } from '../../database/entities/pedido.entity';
import { SalesGoalsModule } from '../sales-goals/sales-goals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido]),
    SalesGoalsModule
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
