import { Module } from '@nestjs/common';
import { AuthenticationModule } from './app/authentication/authentication.module';
import { ClientModule } from './app/client/client.module';
import { CoreModule } from './core/core.module';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [
    CoreModule,
    InfraModule,
    AuthenticationModule,
    ClientModule,
  ],
})
export class AppModule {}
