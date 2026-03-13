import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ClientDescriptionTypeDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/client-description-type-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ClientDescriptionTypeDao,
    useClass: ClientDescriptionTypeDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ClientDescriptionTypePersistenceModule {}
