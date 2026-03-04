import { Module } from '@nestjs/common';
import { AuthenticationModule } from './app/authentication/authentication.module';
import { ClientModuleModule } from './app/client/client-module.module';
import { CompanyModule } from './app/company/company/company.module';
import { ExternalApisModule } from './app/external-apis/external-apis.module';
import { FaqModule } from './app/faq/faq.module';
import { TaxationModuleModule } from './app/taxation/taxation-module.module';
import { UploadFileModule } from './app/upload-file/upload-file.module';
import { CoreModule } from './core/core.module';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [
    CoreModule,
    InfraModule,
    AuthenticationModule,
    ClientModuleModule,
    CompanyModule,
    TaxationModuleModule,
    ExternalApisModule,
    FaqModule,
    UploadFileModule,
  ],
})
export class AppModule {}
