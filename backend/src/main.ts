import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir archivos estáticos (fotos de prendas y recursos públicos)
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/api/',
  });

  // Habilitar CORS para frontend web y app móvil
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Prefijo global de la API
  app.setGlobalPrefix('api');

  // Validación de DTOs automática
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Configuración de Swagger OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Moda Shopping API - Plataforma Inteligente de Comercio Electrónico')
    .setDescription(
      'Documentación de la API REST para Moda Shopping: Tienda de ropa con vestidores virtuales AR, reservas de probadores, gestión de sucursales, inventario, punto de caja (POS) y asistente IA.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Moda Shopping Backend corriendo en: http://localhost:${port}/api`);
  console.log(`📖 Documentación Swagger disponible en: http://localhost:${port}/api/docs`);
}

bootstrap();
