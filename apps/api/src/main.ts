import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser') as typeof import('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  const corsOrigin = config.get<string>('CORS_ORIGIN', 'http://localhost:5173');
  const isProd = config.get<string>('NODE_ENV') === 'production';

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('WorkPilot API')
      .setDescription('Workspace intelligent — API REST')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(port);
  console.log(`🚀 WorkPilot API running on http://localhost:${port}`);
  if (!isProd) {
    console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  }
}

bootstrap();
