import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Pedido } from '../database/entities/pedido.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { SalesGoal } from '../database/entities/sales-goal.entity';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USER', 'postgres'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME', 'dashboard'),
  entities: [Pedido, Usuario, SalesGoal],
  synchronize: configService.get('NODE_ENV') === 'development',
  logging: configService.get('NODE_ENV') === 'development',
  migrations: ['src/database/migrations/*.ts'],
  migrationsRun: false,
  ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});
