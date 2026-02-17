import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

// Require ALLOWED_ORIGIN in production to prevent CORS wildcard
if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGIN) {
  throw new Error('ALLOWED_ORIGIN environment variable is required in production');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigin =
    process.env.ALLOWED_ORIGIN ||
    (process.env.NODE_ENV === 'production' ? undefined : '*');

  app.setGlobalPrefix('api');

  // Security headers middleware
  app.use(helmet());

  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
    }),
  );

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(3000);
}
bootstrap();
