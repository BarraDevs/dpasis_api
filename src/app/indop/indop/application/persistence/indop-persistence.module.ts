import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { IndopDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/indop-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.IndopDao,
    useClass: IndopDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class IndopPersistenceModule {}
