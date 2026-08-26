import { Module } from '@nestjs/common';
import { AdminModule } from './app/admin/admin.module';
import { AuditModule } from './app/audit/audit.module';
import { AuthenticationModule } from './app/authentication/authentication.module';
import { ClientModuleModule } from './app/client/client-module.module';
import { CarrierModule } from './app/carrier/carrier.module';
import { ExternalApisModule } from './app/external-apis/external-apis.module';
import { FaqModule } from './app/global/faq/faq.module';
import { GlobalModule } from './app/global/global.module';
import { HonorificModule } from './app/global/honorific/honorific.module';
import { ProviderModuleModule } from './app/provider/provider-module.module';
import { ResaleModuleModule } from './app/resale/resale-module.module';
import { SellerModule } from './app/seller/seller.module';
import { ServiceModuleModule } from './app/service/service-module.module';
import { UploadFileModule } from './app/upload-file/upload-file.module';
import { VoucherModule } from './app/voucher/voucher.module';
import { CoreModule } from './core/core.module';
import { InfraModule } from './infra/infra.module';
import { TaxInvoiceModule } from './app/tax-invoice/tax-invoice.module';
import { CompanyModuleModule } from './app/company/company-module.module';
import { BankPaymentModule } from './infra/bank-payment/bank-payment.module';

@Module({
  imports: [
    CoreModule,
    InfraModule,
    AuthenticationModule,
    AuditModule,
    AdminModule,
    CarrierModule,
    CompanyModuleModule,
    ClientModuleModule,
    ResaleModuleModule,
    SellerModule,
    ExternalApisModule,
    FaqModule,
    HonorificModule,
    ProviderModuleModule,
    GlobalModule,
    ServiceModuleModule,
    TaxInvoiceModule,
    UploadFileModule,
    VoucherModule,
    BankPaymentModule.register(),
  ],
})
export class AppModule {}
