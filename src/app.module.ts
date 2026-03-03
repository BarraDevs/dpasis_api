import { Module } from '@nestjs/common';
import { AuthenticationModule } from './app/authentication/authentication.module';
import { ClientModuleModule } from './app/client/client-module.module';
import { CnaeModule } from './app/cnae/cnae/cnae.module';
import { CompanyModule } from './app/company/company/company.module';
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
    ClientModuleModule,
    CompanyModule,
    CnaeModule,
    ExternalApisModule,
    FaqModule,
    UploadFileModule,
  ],
})
export class AppModule {}
