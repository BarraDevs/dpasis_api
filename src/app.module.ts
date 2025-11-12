import { Module } from '@nestjs/common';
import { AddressModule } from './app/address/address.module';
import { AttachmentModule } from './app/attachment/attachment.module';
import { AuthenticationModule } from './app/authentication/authentication.module';
import { ClientModule } from './app/client/client.module';
import { CompanyModule } from './app/company/company.module';
import { ContactModule } from './app/contact/contact.module';
import { ItemModule } from './app/item/item.module';
import { LicenseModule } from './app/license/license.module';
import { ShipperModule } from './app/shipper/shipper.module';
import { SupplierModule } from './app/supplier/supplier.module';
import { CoreModule } from './core/core.module';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [
    CoreModule,
    InfraModule,
    AuthenticationModule,
    AddressModule,
    AttachmentModule,
    ClientModule,
    CompanyModule,
    ContactModule,
    ItemModule,
    LicenseModule,
    ShipperModule,
    SupplierModule,
  ],
})
export class AppModule {}
