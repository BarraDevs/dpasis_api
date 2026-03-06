import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ClientInvoiceConfigDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/client-invoice-config-prisma.dao';
import { ClientInvoiceConfigRepositoryAdapterPrisma } from '../../infra/driven/persistence/prisma/client-invoice-config-prisma.repository';

const adapters: Provider[] = [
  {
    provide: TOKENS.ClientInvoiceConfigDao,
    useClass: ClientInvoiceConfigDaoAdapterPrisma,
  },
  {
    provide: TOKENS.ClientInvoiceConfigRepository,
    useClass: ClientInvoiceConfigRepositoryAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ClientInvoiceConfigPersistenceModule {}
