import { Module } from '@nestjs/common';
import { ClientAddressModule } from './client-address/client-address.module';
import { ClientAttachmentModule } from './client-attachment/client-attachment.module';
import { ClientAttendanceTypeModule } from './client-attendance-type/client-attendance-type.module';
import { ClientContactModule } from './client-contact/client-contact.module';
import { ClientDepartmentModule } from './client-department/client-department.module';
import { ClientDiscountModule } from './client-discount/client-discount.module';
import { ClientGroupModule } from './client-group/client-group.module';
import { ClientInvoiceConfigModule } from './client-invoice-config/client-invoice-config.module';
import { ClientItemModule } from './client-item/client-item.module';
import { ClientMaintenanceTicketTypeModule } from './client-maintenance-ticket-type/client-maintenance-ticket-type.module';
import { ClientOwnerModule } from './client-owner/client-owner.module';
import { ClientTypeModuleModule } from './client-type/client-type-module.module';
import { ClientModule } from './client/client.module';

const modules = [
  ClientModule,
  ClientAddressModule,
  ClientAttachmentModule,
  ClientAttendanceTypeModule,
  ClientContactModule,
  ClientDepartmentModule,
  ClientDiscountModule,
  ClientGroupModule,
  ClientInvoiceConfigModule,
  ClientItemModule,
  ClientMaintenanceTicketTypeModule,
  ClientOwnerModule,
  ClientTypeModuleModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class ClientModuleModule {}
