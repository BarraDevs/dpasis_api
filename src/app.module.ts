import { Module } from '@nestjs/common';
import { AddressModule } from './app/address/address.module';
import { AuthenticationModule } from './app/authentication/authentication.module';
import { ClientModule } from './app/client/client.module';
import { ContactModule } from './app/contact/contact.module';
import { LicenseModule } from './app/license/license.module';
import { CoreModule } from './core/core.module';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [
    CoreModule,
    InfraModule,
    AuthenticationModule,
    AddressModule,
    ClientModule,
    ContactModule,
    LicenseModule,
  ],
})
export class AppModule {}
