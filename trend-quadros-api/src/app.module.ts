import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SyncModule } from './modules/sync/sync.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SalesGoalsModule } from './modules/sales-goals/sales-goals.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    OrdersModule,
    SyncModule,
    DashboardModule,
    SalesGoalsModule,
  ],
})
export class AppModule {}