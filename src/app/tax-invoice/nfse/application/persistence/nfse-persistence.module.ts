import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { NfseDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/nfse-prisma.dao';
import { NfseRpsSequenceRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/nfse-rps-sequence-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.NfseDao,
    useClass: NfseDaoAdapterPrisma,
  },
  {
    provide: TOKENS.NfseRpsSequenceRepository,
    useClass: NfseRpsSequenceRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class NfsePersistenceModule {}
