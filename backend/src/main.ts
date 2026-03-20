import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

loadEnv({
  path: resolve(__dirname, '..', '.env'),
});

const DEFAULT_ALLOWED_CORS_ORIGINS = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
];

function resolveAllowedCorsOrigins(): string[] {
  const rawOrigins = process.env.CORS_ALLOWED_ORIGINS;
  if (!rawOrigins?.trim()) {
    return DEFAULT_ALLOWED_CORS_ORIGINS;
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function isAllowedLocalDevOrigin(origin: string): boolean {
  return (
    /^http:\/\/localhost:\d+$/i.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/i.test(origin)
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = resolveAllowedCorsOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isExplicitlyAllowed = allowedOrigins.includes(origin);
      if (isExplicitlyAllowed || isAllowedLocalDevOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
