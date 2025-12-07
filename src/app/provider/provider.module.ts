import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module';
import { CompanyModule } from '../company/company.module';
import { ProviderPersistenceModule } from './application/persistence/provider-persistence.module';
import { CreateProvider } from './application/usecases/create-provider/create-provider.service';
import { EditProvider } from './application/usecases/edit-provider/edit-provider.service';
import { FindAllProvider } from './application/usecases/find-all-provider/find-all-provider.service';
import { FindProviderById } from './application/usecases/find-provider-by-id/find-provider-by-id.service';
import { UpdateProviderStatus } from './application/usecases/update-provider-status/update-provider-status.service';
import { ProviderController } from './infra/drivers/http/provider.controller';

@Module({
  imports: [
    ProviderPersistenceModule,
    AuthenticationGuardsModule,
    CompanyModule,
  ],
  controllers: [
    ProviderController,
  ],
  providers: [
    CreateProvider,
    EditProvider,
    FindAllProvider,
    FindProviderById,
    UpdateProviderStatus,
  ],
  exports: [],
})
export class ProviderModule {}
