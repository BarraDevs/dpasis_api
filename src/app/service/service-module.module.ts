import { Module } from '@nestjs/common';
import { ServiceCategoryModule } from './service-category/service-category.module';
import { ServiceFreightModule } from './service-freight/service-freight.module';

const modules = [
  ServiceCategoryModule,
  ServiceFreightModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class ServiceModuleModule {}
