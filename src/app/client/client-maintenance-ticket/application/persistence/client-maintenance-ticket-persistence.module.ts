import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ClientMaintenanceTicketDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/client-maintenance-ticket-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ClientMaintenanceTicketDao,
    useClass: ClientMaintenanceTicketDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ClientMaintenanceTicketPersistenceModule {}
