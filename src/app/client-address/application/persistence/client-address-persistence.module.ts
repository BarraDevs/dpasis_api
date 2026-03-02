import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ClientAddressDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/client-address-prisma.dao';
import { ClientAddressRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/client-address-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ClientAddressDao,
    useClass: ClientAddressDaoAdapterPrisma,
  },
  {
    provide: TOKENS.ClientAddressRepository,
    useClass: ClientAddressRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ClientAddressPersistenceModule {}
