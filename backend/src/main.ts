import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { validationExceptionFactory } from './common/utils/validation.factory';
import { setupSwagger } from './config/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Behind nginx / a load balancer: trust X-Forwarded-For so rate limiting sees the real client IP
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.enableShutdownHooks();

  const prefix = config.get<string>('app.apiPrefix', 'api');
  app.setGlobalPrefix(prefix);
  app.enableCors({ origin: config.get<string[]>('app.corsOrigins'), credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );

  if (config.get<boolean>('app.swaggerEnabled')) setupSwagger(app, prefix);

  const port = config.get<number>('app.port', 3000);
  await app.listen(port);
  Logger.log(`API is running on port ${port} (docs: /${prefix}/docs)`, 'Bootstrap');
}

bootstrap();
