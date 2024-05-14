import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validationExceptionFactory } from './common/utils/validation.factory';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix(config.get<string>('app.apiPrefix', 'api'));
  app.enableCors({ origin: config.get<string[]>('app.corsOrigins'), credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );

  const port = config.get<number>('app.port', 3000);
  await app.listen(port);
  Logger.log(`API is running on port ${port}`, 'Bootstrap');
}

bootstrap();
