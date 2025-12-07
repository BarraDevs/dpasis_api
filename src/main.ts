import compression from 'compression';
import fs from 'fs';
import helmet from 'helmet';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Environment } from './core/config/environment.enum';
import { pipeOptions } from './infra/validators/class/config';

async function bootstrap() {
  const app = process.env.NODE_ENV !== Environment.Production
    ? await NestFactory.create(AppModule)
    : await NestFactory.create(AppModule,
      {
        httpsOptions: {
          key: fs.readFileSync(process.env.SSL_KEY!),
          cert: fs.readFileSync(process.env.SSL_CERT!),
          ca: fs.readFileSync(process.env.SSL_CA!),
        },
      }
    );

  const config = new DocumentBuilder()
    .setTitle('DPASIS REST API')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config, { autoTagControllers: false });
  SwaggerModule.setup('swagger', app, document);

  app.useGlobalPipes(new ValidationPipe(pipeOptions));

  app.use(helmet());
  app.use(compression());
  app.enableCors();

  await app.listen(process.env.PORT as string);
}
bootstrap();
