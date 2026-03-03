import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../../authentication/application/guards/guards.module';
import { CompanyPersistenceModule } from './application/persistence/company-persistence.module';
import { ActivateCompany } from './application/usecases/activate-company/activate-company.service';
import { CreateCompany } from './application/usecases/create-company/create-company.service';
import { DeactivateCompany } from './application/usecases/deactivate-company/deactivate-company.service';
import { EditCompany } from './application/usecases/edit-company/edit-company.service';
import { FindAllCompany } from './application/usecases/find-all-company/find-all-company.service';
import { FindCompanyById } from './application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyAdminController } from './infra/drivers/http/admin/company-admin.controller';

@Module({
  imports: [
    CompanyPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    CompanyAdminController,
  ],
  providers: [
    ActivateCompany,
    CreateCompany,
    DeactivateCompany,
    EditCompany,
    FindAllCompany,
    FindCompanyById,
  ],
  exports: [
    FindCompanyById,
  ],
})
export class CompanyModule {}
