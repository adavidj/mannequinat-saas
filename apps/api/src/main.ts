import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { securityHeadersMiddleware } from './config/security-headers';

async function bootstrap(): Promise<void> {
  // Échouer avant d'ouvrir un port : un secret absent, trop faible ou resté à
  // l'état d'exemple ne doit jamais laisser démarrer une API de production.
  new AppConfigService().validateEnvironment();

  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use(securityHeadersMiddleware());
  // Derrière un reverse proxy (Vercel, Nginx, Caddy), request.ip doit rester fiable
  // pour le rate limiting et le journal d'audit.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ModelBénin API')
    .setDescription('Documentation technique de l’API ModelBénin.')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(process.env.API_PORT ?? 3001);
}

void bootstrap();
