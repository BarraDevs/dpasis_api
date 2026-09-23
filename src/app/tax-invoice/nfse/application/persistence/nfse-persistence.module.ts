import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { NfseClassificationDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/nfse-classification-prisma.dao';
import { NfseOutboxDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/nfse-outbox-prisma.dao';
import { NfseDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/nfse-prisma.dao';
import { NfseRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/nfse-prisma.repository';
import { NfseRpsSequenceRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/nfse-rps-sequence-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.NfseDao,
    useClass: NfseDaoAdapterPrisma,
  },
  {
    provide: TOKENS.NfseClassificationDao,
    useClass: NfseClassificationDaoAdapterPrisma,
  },
  {
    provide: TOKENS.NfseOutboxDao,
    useClass: NfseOutboxDaoAdapterPrisma,
  },
  {
    provide: TOKENS.NfseRepository,
    useClass: NfseRepositoryAdapterPrisma,
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
