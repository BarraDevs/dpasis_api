import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ProviderPersistenceModule } from './application/persistence/provider-persistence.module';
import { ActivateProvider } from './application/usecases/activate-provider/activate-provider.service';
import { CreateProvider } from './application/usecases/create-provider/create-provider.service';
import { DeactivateProvider } from './application/usecases/deactivate-provider/deactivate-provider.service';
import { DeleteProvider } from './application/usecases/delete-provider/delete-provider.service';
import { EditProvider } from './application/usecases/edit-provider/edit-provider.service';
import { FindAllProvider } from './application/usecases/find-all-provider/find-all-provider.service';
import { FindProviderById } from './application/usecases/find-provider-by-id/find-provider-by-id.service';
import { ProviderAdminController } from './infra/drivers/http/admin/provider-admin.controller';

@Module({
  imports: [
    ProviderPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ProviderAdminController,
  ],
  providers: [
    ActivateProvider,
    CreateProvider,
    DeactivateProvider,
    DeleteProvider,
    EditProvider,
    FindAllProvider,
    FindProviderById,
  ],
  exports: [
    FindProviderById,
  ],
})
export class ProviderModule {}
