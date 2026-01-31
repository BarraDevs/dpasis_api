import { Module } from '@nestjs/common';
import { CompanyModule } from 'src/app/company/company.module';
import { ProductModule } from 'src/app/product/product.module';
import { ServiceCategoryModule } from 'src/app/service-category/service-category.module';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { ServicePersistenceModule } from './application/persistence/service-persistence.module';
import { CreateService } from './application/usecases/create-service/create-service.service';
import { EditService } from './application/usecases/edit-service/edit-service.service';
import { FindAllService } from './application/usecases/find-all-service/find-all-service.service';
import { FindServiceById } from './application/usecases/find-service-by-id/find-service-by-id.service';
import { UpdateServiceStatus } from './application/usecases/update-service-status/update-service-status.service';
import { ServiceController } from './infra/drivers/http/service.controller';

@Module({
  imports: [
    ServicePersistenceModule,
    CompanyModule,
    ProductModule,
    ServiceCategoryModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ServiceController,
  ],
  providers: [
    CreateService,
    EditService,
    FindAllService,
    FindServiceById,
    UpdateServiceStatus,
  ],
  exports: [
    CreateService,
    FindServiceById,
  ],
})
export class ServiceModule {}
