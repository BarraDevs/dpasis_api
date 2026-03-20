import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ServiceProposalValidityDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/service-proposal-validity-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ServiceProposalValidityDao,
    useClass: ServiceProposalValidityDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ServiceProposalValidityPersistenceModule {}
