import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { EmailTemplateDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/email-template-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.EmailTemplateDao,
    useClass: EmailTemplateDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class EmailTemplatePersistenceModule {}
