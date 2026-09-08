import compression from 'compression';
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
      // {
      //   httpsOptions: {
      //     key: fs.readFileSync(process.env.SSL_KEY!),
      //     cert: fs.readFileSync(process.env.SSL_CERT!),
      //     ca: fs.readFileSync(process.env.SSL_CA!),
      //   },
      // }
    );

  const config = new DocumentBuilder()
    .setTitle('DPASIS REST API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config, { autoTagControllers: false });
  SwaggerModule.setup('swagger', app, document);

  app.useGlobalPipes(new ValidationPipe(pipeOptions));

  app.use(helmet());
  app.use(compression());
  app.enableCors();

  // Sem isto o Nest ignora `SIGTERM`: o processo morre com jobs em execução, e cada job morto no
  // meio é uma NFS-e ou um boleto em estado ambíguo. Com os hooks ligados, os workers do BullMQ
  // fecham drenando o que está em voo.
  app.enableShutdownHooks();

  await app.listen(process.env.PORT as string);
}
bootstrap();
