import { Module } from '@nestjs/common';
import { AdminModule } from './app/admin/admin.module';
import { AuditModule } from './app/audit/audit.module';
import { AuthenticationModule } from './app/authentication/authentication.module';
import { ClientModuleModule } from './app/client/client-module.module';
import { CompanyModule } from './app/company/company.module';
import { ExternalApisModule } from './app/external-apis/external-apis.module';
import { FaqModule } from './app/faq/faq.module';
import { GlobalModule } from './app/global/global.module';
import { ResaleModuleModule } from './app/resale/resale-module.module';
import { ServiceModuleModule } from './app/service/service-module.module';
import { UploadFileModule } from './app/upload-file/upload-file.module';
import { VoucherModule } from './app/voucher/voucher.module';
import { CoreModule } from './core/core.module';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [
    CoreModule,
    InfraModule,
    AuthenticationModule,
    AuditModule,
    AdminModule,
    CompanyModule,
    ClientModuleModule,
    ResaleModuleModule,
    ExternalApisModule,
    FaqModule,
    GlobalModule,
    ServiceModuleModule,
    UploadFileModule,
    VoucherModule,
  ],
})
export class AppModule {}
