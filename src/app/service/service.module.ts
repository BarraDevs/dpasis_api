import { Module } from '@nestjs/common';
import { CompanyModule } from 'src/app/company/company.module';
import { ProductModule } from 'src/app/product/product.module';
import { ServiceCategoryModule } from 'src/app/service-category/service-category.module';
import { ServicePersistenceModule } from './application/persistence/service-persistence.module';
import { CreateService } from './application/usecases/create-service/create-service.service';

@Module({
  imports: [
    ServicePersistenceModule,
    CompanyModule,
    ProductModule,
    ServiceCategoryModule,
  ],
  providers: [
    CreateService,
  ],
  exports: [],
})
export class ServiceModule {}
