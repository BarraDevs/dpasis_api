import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { NfmCronRunDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/nfm-cron-run-prisma.dao';
import { NfmDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/nfm-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.NfmDao,
    useClass: NfmDaoAdapterPrisma,
  },
  {
    provide: TOKENS.NfmCronRunDao,
    useClass: NfmCronRunDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class NfmPersistenceModule {}
