import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ContactDaoAdapterPrisma } from '../../infra/driven/persistence/contact.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.ContactDao,
    useClass: ContactDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class ContactPersistenceModule {}
