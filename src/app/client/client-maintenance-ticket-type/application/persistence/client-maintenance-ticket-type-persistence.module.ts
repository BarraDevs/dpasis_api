import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ClientMaintenanceTicketTypeDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/client-maintenance-ticket-type-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ClientMaintenanceTicketTypeDao,
    useClass: ClientMaintenanceTicketTypeDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ClientMaintenanceTicketTypePersistenceModule {}
