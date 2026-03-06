import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ClientDiscountDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/client-discount-prisma.dao';
import { ClientDiscountRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/client-discount-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ClientDiscountDao,
    useClass: ClientDiscountDaoAdapterPrisma,
  },
  {
    provide: TOKENS.ClientDiscountRepository,
    useClass: ClientDiscountRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ClientDiscountPersistenceModule {}
