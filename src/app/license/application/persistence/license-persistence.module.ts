import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { LicenseDaoAdapterPrisma } from '../../infra/driven/persistence/license.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.LicenseDao,
    useClass: LicenseDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class LicensePersistenceModule {}
