import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ProposalValidityDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/proposal-validity-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ProposalValidityDao,
    useClass: ProposalValidityDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ProposalValidityPersistenceModule {}
