import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as requestIp from 'request-ip';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { start } from 'elastic-apm-node';
start();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: true });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // correct source IP
  app.use(requestIp.mw());
  app.set('trust proxy', 1);

  // Protect against a multitude of attack scenarios
  app.use(helmet());

  // CORS
  app.enableCors();

  // Request param/body/query validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }));

  // Rate limiter
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // limit each IP to 500 requests per windowMs
    }),
  );

  // Swagger
  const options = new DocumentBuilder()
    .setTitle('FlyByWire Simulations API')
    .setDescription('The FlyByWire Simulations API description')
    .setVersion('1.0')
    .addSecurity('jwt', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}

bootstrap();
