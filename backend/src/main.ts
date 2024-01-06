import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

  // Lisää CORS-middleware
  app.use(cors({
    origin: allowedOrigin,
    credentials: true,
  }));

  await app.listen(3000);
}
bootstrap();
