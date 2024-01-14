import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
    }),
  );

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
}
bootstrap();
