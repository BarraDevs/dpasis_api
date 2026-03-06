import { Module } from '@nestjs/common';
import { ClientAddressModule } from './client-address/client-address.module';
import { ClientContactModule } from './client-contact/client-contact.module';
import { ClientDepartmentModule } from './client-department/client-department.module';
import { ClientGroupModule } from './client-group/client-group.module';
import { ClientInvoiceConfigModule } from './client-invoice-config/client-invoice-config.module';
import { ClientItemModule } from './client-item/client-item.module';
import { ClientOwnerModule } from './client-owner/client-owner.module';
import { ClientModule } from './client/client.module';

const modules = [
  ClientAddressModule,
  ClientContactModule,
  ClientInvoiceConfigModule,
  ClientItemModule,
  ClientDepartmentModule,
  ClientGroupModule,
  ClientOwnerModule,
  ClientModule,
];


@Module({
  imports: [...modules],
  exports: [...modules],
})
export class ClientModuleModule {}
