import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { FaqDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/faq-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.FaqDao,
    useClass: FaqDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class FaqPersistenceModule {}
