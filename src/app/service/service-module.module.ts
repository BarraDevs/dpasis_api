import { Module } from '@nestjs/common';
import { ServiceCategoryModule } from './service-category/service-category.module';
import { ServiceDeliveryTermModule } from './service-delivery-term/service-delivery-term.module';
import { ServiceFreightModule } from './service-freight/service-freight.module';
import { ServiceWarrantyModule } from './service-warranty/service-warranty.module';

const modules = [
  ServiceCategoryModule,
  ServiceFreightModule,
  ServiceDeliveryTermModule,
  ServiceWarrantyModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class ServiceModuleModule {}
