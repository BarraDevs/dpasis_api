import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { AttachmentDaoAdapterPrisma } from '../../infra/driven/persistence/attachment.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.AttachmentDao,
    useClass: AttachmentDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class AttachmentPersistenceModule {}
