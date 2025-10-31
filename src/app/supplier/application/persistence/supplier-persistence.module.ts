import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { SupplierDaoAdapterPrisma } from '../../infra/driven/persistence/supplier.dao';
import { SupplierRepositoryAdapterPrisma } from '../../infra/driven/persistence/supplier.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.SupplierDao,
    useClass: SupplierDaoAdapterPrisma,
  },
  {
    provide: TOKENS.SupplierRepository,
    useClass: SupplierRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class SupplierPersistenceModule {}
