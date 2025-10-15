import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesGoalsController } from './sales-goals.controller';
import { SalesGoalsService } from './sales-goals.service';
import { SalesGoal } from '../../database/entities/sales-goal.entity';
import { Usuario } from '../../database/entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesGoal, Usuario])
  ],
  controllers: [SalesGoalsController],
  providers: [SalesGoalsService],
  exports: [SalesGoalsService]
})
export class SalesGoalsModule {}
