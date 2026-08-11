import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CompanyModule } from 'src/app/company/company/company.module';
import { CompanyNfsConfigPersistenceModule } from './application/persistence/company-nfs-config-persistence.module';
import { CreateCompanyNfsConfig } from './application/usecases/create-company-nfs-config/create-company-nfs-config.service';
import { EditCompanyNfsConfig } from './application/usecases/edit-company-nfs-config/edit-company-nfs-config.service';
import { FindCompanyNfsConfigByCompanyId } from './application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { CompanyNfsConfigAdminController } from './infra/drivers/http/admin/company-nfs-config-admin.controller';

@Module({
  imports: [
    CompanyNfsConfigPersistenceModule,
    CompanyModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    CompanyNfsConfigAdminController,
  ],
  providers: [
    CreateCompanyNfsConfig,
    EditCompanyNfsConfig,
    FindCompanyNfsConfigByCompanyId,
  ],
  exports: [
    FindCompanyNfsConfigByCompanyId,
  ],
})
export class CompanyNfsConfigModule {}
