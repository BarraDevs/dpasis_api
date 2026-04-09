import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { BankPersistenceModule } from './application/persistence/bank-persistence.module';
import { CreateBank } from './application/usecases/create-bank/create-bank.service';
import { DeleteBank } from './application/usecases/delete-bank/delete-bank.service';
import { EditBank } from './application/usecases/edit-bank/edit-bank.service';
import { FindAllBank } from './application/usecases/find-all-bank/find-all-bank.service';
import { FindBankById } from './application/usecases/find-bank-by-id/find-bank-by-id.service';
import { UpdateBankStatus } from './application/usecases/update-bank-status/update-bank-status.service';
import { BankAdminController } from './infra/drivers/http/admin/bank-admin.controller';

@Module({
  imports: [
    BankPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    BankAdminController,
  ],
  providers: [
    CreateBank,
    DeleteBank,
    EditBank,
    FindAllBank,
    FindBankById,
    UpdateBankStatus,
  ],
  exports: [
    FindBankById,
  ],
})
export class BankModule {}
