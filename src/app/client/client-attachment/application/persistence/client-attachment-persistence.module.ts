import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ClientAttachmentDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/client-attachment-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ClientAttachmentDao,
    useClass: ClientAttachmentDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ClientAttachmentPersistenceModule {}
