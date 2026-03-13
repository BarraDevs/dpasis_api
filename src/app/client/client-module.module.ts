import { Module } from '@nestjs/common';
import { ClientAddressModule } from './client-address/client-address.module';
import { ClientAttachmentModule } from './client-attachment/client-attachment.module';
import { ClientAttendanceTypeModule } from './client-attendance-type/client-attendance-type.module';
import { ClientContactModule } from './client-contact/client-contact.module';
import { ClientMaintenanceTicketTypeModule } from './client-maintenance-ticket-type/client-maintenance-ticket-type.module';
import { ClientDepartmentModule } from './client-department/client-department.module';
import { ClientDescriptionTypeModule } from './client-description-type/client-description-type.module';
import { ClientSystemTypeModule } from './client-system-type/client-system-type.module';
import { ClientDiscountModule } from './client-discount/client-discount.module';
import { ClientGroupModule } from './client-group/client-group.module';
import { ClientInvoiceConfigModule } from './client-invoice-config/client-invoice-config.module';
import { ClientItemModule } from './client-item/client-item.module';
import { ClientOwnerModule } from './client-owner/client-owner.module';
import { ClientModule } from './client/client.module';

const modules = [
  ClientAddressModule,
  ClientAttachmentModule,
  ClientAttendanceTypeModule,
  ClientContactModule,
  ClientMaintenanceTicketTypeModule,
  ClientDescriptionTypeModule,
  ClientSystemTypeModule,
  ClientDiscountModule,
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
