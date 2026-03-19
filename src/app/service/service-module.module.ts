import { Module } from '@nestjs/common';
import { ServiceCategoryModule } from './service-category/service-category.module';

const modules = [
  ServiceCategoryModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class ServiceModuleModule {}
