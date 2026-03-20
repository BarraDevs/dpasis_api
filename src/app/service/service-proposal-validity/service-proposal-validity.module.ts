import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ServiceProposalValidityPersistenceModule } from './application/persistence/service-proposal-validity-persistence.module';
import { CreateServiceProposalValidity } from './application/usecases/create-service-proposal-validity/create-service-proposal-validity.service';
import { DeleteServiceProposalValidity } from './application/usecases/delete-service-proposal-validity/delete-service-proposal-validity.service';
import { EditServiceProposalValidity } from './application/usecases/edit-service-proposal-validity/edit-service-proposal-validity.service';
import { FindAllServiceProposalValidity } from './application/usecases/find-all-service-proposal-validity/find-all-service-proposal-validity.service';
import { FindServiceProposalValidityById } from './application/usecases/find-service-proposal-validity-by-id/find-service-proposal-validity-by-id.service';
import { UpdateServiceProposalValidityStatus } from './application/usecases/update-service-proposal-validity-status/update-service-proposal-validity-status.service';
import { ServiceProposalValidityAdminController } from './infra/drivers/http/admin/service-proposal-validity-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    ServiceProposalValidityPersistenceModule,
  ],
  controllers: [
    ServiceProposalValidityAdminController,
  ],
  providers: [
    CreateServiceProposalValidity,
    DeleteServiceProposalValidity,
    EditServiceProposalValidity,
    FindAllServiceProposalValidity,
    FindServiceProposalValidityById,
    UpdateServiceProposalValidityStatus,
  ],
  exports: [
    FindServiceProposalValidityById,
  ],
})
export class ServiceProposalValidityModule {}
