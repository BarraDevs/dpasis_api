import { Module } from '@nestjs/common';
import { BilledModule } from '../global/billed/billed.module';
import { CategoryModule } from '../global/category/category.module';
import { DeliveryTermModule } from '../global/delivery-term/delivery-term.module';
import { FreightModule } from '../global/freight/freight.module';
import { ProposalValidityModule } from '../global/proposal-validity/proposal-validity.module';
import { WarrantyModule } from '../global/warranty/warranty.module';
import { ServiceAttendanceValueModule } from './service-attendance-value/service-attendance-value.module';
import { ServiceCatalogModule } from './service-catalog/service-catalog.module';

const modules = [
  ServiceAttendanceValueModule,
  ServiceCatalogModule,
];

@Module({
  imports: [
    ...modules,
    BilledModule,
    CategoryModule,
    DeliveryTermModule,
    FreightModule,
    ProposalValidityModule,
    WarrantyModule,
  ],
  exports: [...modules],
})
export class ServiceModuleModule {}
