import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.setGlobalPrefix(configService.get<string>('app.apiPrefix', 'api'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidUnknownValues: false,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tasmil API')
    .setDescription('Questing platform API documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(
    `${configService.get<string>('app.apiPrefix', 'api')}/docs`,
    app,
    document,
  );

  const port = configService.get<number>('app.port', 5555);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Server ready at http://localhost:${port}`);

  // Send ready signal to PM2
  if (process.send) {
    process.send('ready');
  }
}
bootstrap();