import { Module } from '@nestjs/common';
import { AuthenticationModule } from './app/authentication/authentication.module';
import { ClientGroupModule } from './app/client-group/client-group.module';
import { ClientOwnerModule } from './app/client-owner/client-owner.module';
import { FaqModule } from './app/faq/faq.module';
import { CoreModule } from './core/core.module';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [
    CoreModule,
    InfraModule,
    AuthenticationModule,
    ClientGroupModule,
    ClientOwnerModule,
    FaqModule,
  ],
})
export class AppModule {}
