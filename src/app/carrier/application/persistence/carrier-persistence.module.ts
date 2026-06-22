import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { CarrierDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/carrier-prisma.dao';
import { CarrierRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/carrier-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.CarrierDao,
    useClass: CarrierDaoAdapterPrisma,
  },
  {
    provide: TOKENS.CarrierRepository,
    useClass: CarrierRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class CarrierPersistenceModule {}
