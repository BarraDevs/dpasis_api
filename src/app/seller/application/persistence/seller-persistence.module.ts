import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { SellerDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/seller.dao';
import { SellerRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/seller.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.SellerDao,
    useClass: SellerDaoAdapterPrisma,
  },
  {
    provide: TOKENS.SellerRepository,
    useClass: SellerRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class SellerPersistenceModule {}
