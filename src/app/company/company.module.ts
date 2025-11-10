import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { CompanyPersistenceModule } from './application/persistence/company-persistence.module';
import { CreateCompany } from './application/usecases/create-company/create-company.service';
import { EditCompany } from './application/usecases/edit-company/edit-company.service';
import { FindAllCompany } from './application/usecases/find-all-company/find-all-company.service';
import { FindCompanyById } from './application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyController } from './infra/drivers/http/company.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    CompanyPersistenceModule,
  ],
  controllers: [
    CompanyController,
  ],
  providers: [
    CreateCompany,
    EditCompany,
    FindAllCompany,
    FindCompanyById,
  ],
  exports: [],
})
export class CompanyModule {}
