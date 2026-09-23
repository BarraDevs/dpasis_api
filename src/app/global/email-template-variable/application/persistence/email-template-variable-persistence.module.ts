import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { EmailTemplateVariableDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/email-template-variable-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.EmailTemplateVariableDao,
    useClass: EmailTemplateVariableDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class EmailTemplateVariablePersistenceModule {}
