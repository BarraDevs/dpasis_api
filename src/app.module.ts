import { Module } from '@nestjs/common';
import { AddressModule } from './app/address/address.module';
import { AttachmentModule } from './app/attachment/attachment.module';
import { AuthenticationModule } from './app/authentication/authentication.module';
import { BudgetModule } from './app/budget/budget.module';
import { ClientModule } from './app/client/client.module';
import { CompanyModule } from './app/company/company.module';
import { ContactModule } from './app/contact/contact.module';
import { ItemModule } from './app/item/item.module';
import { LicenseModule } from './app/license/license.module';
import { ProductModule } from './app/product/product.module';
import { ProviderModule } from './app/provider/provider.module';
import { SellerModule } from './app/seller/seller.module';
import { ServiceCategoryModule } from './app/service-category/service-category.module';
import { ServiceModule } from './app/service/service.module';
import { ShipperModule } from './app/shipper/shipper.module';
import { SupplierModule } from './app/supplier/supplier.module';
import { UploadFileModule } from './app/upload-file/upload-file.module';
import { CoreModule } from './core/core.module';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [
    CoreModule,
    InfraModule,
    AuthenticationModule,
    AddressModule,
    AttachmentModule,
    BudgetModule,
    ClientModule,
    CompanyModule,
    ContactModule,
    ItemModule,
    LicenseModule,
    ProductModule,
    ProviderModule,
    SellerModule,
    ServiceModule,
    ServiceCategoryModule,
    ShipperModule,
    SupplierModule,
    UploadFileModule,
  ],
})
export class AppModule {}
