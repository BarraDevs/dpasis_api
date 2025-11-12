import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ShipperDaoAdapterPrisma } from '../../infra/driven/persistence/shipper.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ShipperDao,
    useClass: ShipperDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ShipperPersistenceModule {}
