import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ResaleContactDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/resale-contact-prisma.dao';
import { ResaleContactRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/resale-contact-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ResaleContactDao,
    useClass: ResaleContactDaoAdapterPrisma,
  },
  {
    provide: TOKENS.ResaleContactRepository,
    useClass: ResaleContactRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ResaleContactPersistenceModule {}
