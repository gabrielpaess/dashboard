import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as https from 'https';

async function bootstrap() {
  let app;
  
  // Verificar se certificados SSL existem
  const sslCertPath = process.env.SSL_CERT_PATH || '/etc/ssl/trend-quadros/fullchain.pem';
  const sslKeyPath = process.env.SSL_KEY_PATH || '/etc/ssl/trend-quadros/privkey.pem';
  
  if (fs.existsSync(sslCertPath) && fs.existsSync(sslKeyPath)) {
    console.log('🔐 Iniciando servidor com HTTPS...');
    const httpsOptions = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath),
    };
    app = await NestFactory.create(AppModule, { httpsOptions });
  } else {
    console.log('⚠️ Certificados SSL não encontrados, iniciando com HTTP...');
    app = await NestFactory.create(AppModule);
  }

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // CORS configuration
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://168.231.90.41:5173',
        'http://168.231.90.41:3000',
        'https://trend-quadros-dashboard.vercel.app',
        'https://www.pontodeshboard.com'
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (ex: mobile apps, Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`❌ CORS bloqueado para origem: ${origin}`);
        callback(new Error('Não permitido pelo CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Dashboard API')
    .setDescription('API REST para o Dashboard de Pedidos - Ponto Quadros')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Health check endpoint (without /api prefix)
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  const protocol = fs.existsSync(sslCertPath) && fs.existsSync(sslKeyPath) ? 'https' : 'http';
  const host = process.env.HOST || '0.0.0.0';
  
  console.log(`🚀 Server running on ${protocol}://${host}:${port}`);
  console.log(`📊 Health check: ${protocol}://${host}:${port}/health`);
  console.log(`📚 API Documentation: ${protocol}://${host}:${port}/api/docs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (protocol === 'https') {
    console.log('🔐 HTTPS habilitado com certificados SSL');
  } else {
    console.log('⚠️ HTTP ativo - configure HTTPS para produção');
  }
}

bootstrap();