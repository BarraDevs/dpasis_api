import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ResaleDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/resale-prisma.dao';
import { ResaleRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/resale-prisma.repository';
import { ResaleSequenceRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/resale-sequence-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ResaleDao,
    useClass: ResaleDaoAdapterPrisma,
  },
  {
    provide: TOKENS.ResaleRepository,
    useClass: ResaleRepositoryAdapterPrisma,
  },
  {
    provide: TOKENS.ResaleSequenceRepository,
    useClass: ResaleSequenceRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ResalePersistenceModule {}
