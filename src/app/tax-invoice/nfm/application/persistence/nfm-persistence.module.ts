import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { NfmDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/nfm-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.NfmDao,
    useClass: NfmDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class NfmPersistenceModule {}
