import { Module } from '@nestjs/common';
import { AuthenticationModule } from './app/authentication/authentication.module';
import { ClientAddressModule } from './app/client-address/client-address.module';
import { ClientGroupModule } from './app/client-group/client-group.module';
import { ClientOwnerModule } from './app/client-owner/client-owner.module';
import { ClientModule } from './app/client/client.module';
import { ExternalApisModule } from './app/external-apis/external-apis.module';
import { FaqModule } from './app/faq/faq.module';
import { UploadFileModule } from './app/upload-file/upload-file.module';
import { CoreModule } from './core/core.module';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [
    CoreModule,
    InfraModule,
    AuthenticationModule,
    ClientAddressModule,
    ClientGroupModule,
    ClientOwnerModule,
    ClientModule,
    ExternalApisModule,
    FaqModule,
    UploadFileModule,
  ],
})
export class AppModule {}
