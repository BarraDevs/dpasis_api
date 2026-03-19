import { Module } from '@nestjs/common';
import { AuthenticationModule } from './app/authentication/authentication.module';
import { BankModule } from './app/bank/bank.module';
import { ClientModuleModule } from './app/client/client-module.module';
import { CompanyModule } from './app/company/company.module';
import { ExternalApisModule } from './app/external-apis/external-apis.module';
import { FaqModule } from './app/faq/faq.module';
import { ServiceModuleModule } from './app/service/service-module.module';
import { TaxationModuleModule } from './app/taxation/taxation-module.module';
import { UploadFileModule } from './app/upload-file/upload-file.module';
import { CoreModule } from './core/core.module';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [
    CoreModule,
    InfraModule,
    AuthenticationModule,
    BankModule,
    ClientModuleModule,
    CompanyModule,
    ExternalApisModule,
    FaqModule,
    ServiceModuleModule,
    TaxationModuleModule,
    UploadFileModule,
  ],
})
export class AppModule {}
