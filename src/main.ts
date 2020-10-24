import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as requestIp from 'request-ip';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(requestIp.mw());
  app.set('trust proxy', 1);
  app.use(helmet());
  app.enableCors();
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('FlyByWire Simulations API')
    .setDescription('The FlyByWire Simulations API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}

bootstrap();
