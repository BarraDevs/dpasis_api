import { Module, Provider } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { VoucherDaoAdapterPrisma } from '../../infra/driven/persistence/prisma/voucher-prisma.dao';

const adapters: Provider[] = [
  {
    provide: TOKENS.VoucherDao,
    useClass: VoucherDaoAdapterPrisma,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [...adapters],
  exports: [...adapters],
})
export class VoucherPersistenceModule {}
