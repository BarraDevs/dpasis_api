import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { AddressDaoAdapterPrisma } from '../../infra/driven/persistence/address.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.AddressDao,
    useClass: AddressDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class AddressPersistenceModule {}
