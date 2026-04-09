import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { FreightDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/freight-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.FreightDao,
    useClass: FreightDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class FreightPersistenceModule {}
