import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ProposalValidityPersistenceModule } from './application/persistence/proposal-validity-persistence.module';
import { CreateProposalValidity } from './application/usecases/create-proposal-validity/create-proposal-validity.service';
import { DeleteProposalValidity } from './application/usecases/delete-proposal-validity/delete-proposal-validity.service';
import { EditProposalValidity } from './application/usecases/edit-proposal-validity/edit-proposal-validity.service';
import { FindAllProposalValidity } from './application/usecases/find-all-proposal-validity/find-all-proposal-validity.service';
import { FindProposalValidityById } from './application/usecases/find-proposal-validity-by-id/find-proposal-validity-by-id.service';
import { UpdateProposalValidityStatus } from './application/usecases/update-proposal-validity-status/update-proposal-validity-status.service';
import { ProposalValidityAdminController } from './infra/drivers/http/admin/proposal-validity-admin.controller';

@Module({
  imports: [
    AuthenticationGuardsModule,
    ProposalValidityPersistenceModule,
  ],
  controllers: [
    ProposalValidityAdminController,
  ],
  providers: [
    CreateProposalValidity,
    DeleteProposalValidity,
    EditProposalValidity,
    FindAllProposalValidity,
    FindProposalValidityById,
    UpdateProposalValidityStatus,
  ],
  exports: [
    FindProposalValidityById,
  ],
})
export class ProposalValidityModule {}
