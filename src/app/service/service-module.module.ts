import { Module } from '@nestjs/common';
import { BilledModule } from './billed/billed.module';
import { CategoryModule } from './category/category.module';
import { DeliveryTermModule } from './delivery-term/delivery-term.module';
import { FreightModule } from './freight/freight.module';
import { ProposalValidityModule } from './proposal-validity/proposal-validity.module';
import { ServiceAttendanceValueModule } from './service-attendance-value/service-attendance-value.module';
import { ServiceCatalogModule } from './service-catalog/service-catalog.module';
import { WarrantyModule } from './warranty/warranty.module';

const modules = [
  ServiceAttendanceValueModule,
  BilledModule,
  ServiceCatalogModule,
  CategoryModule,
  FreightModule,
  DeliveryTermModule,
  WarrantyModule,
  ProposalValidityModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class ServiceModuleModule {}
