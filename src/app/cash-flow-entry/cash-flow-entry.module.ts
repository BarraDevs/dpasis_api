import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CompanyModule } from 'src/app/company/company/company.module';
import { CashFlowEntryPersistenceModule } from './application/persistence/cash-flow-entry-persistence.module';
import { CreateCashFlowEntry } from './application/usecases/create-cash-flow-entry/create-cash-flow-entry.service';
import { DeleteCashFlowEntry } from './application/usecases/delete-cash-flow-entry/delete-cash-flow-entry.service';
import { EditCashFlowEntry } from './application/usecases/edit-cash-flow-entry/edit-cash-flow-entry.service';
import { FindAllCashFlowEntry } from './application/usecases/find-all-cash-flow-entry/find-all-cash-flow-entry.service';
import { FindCashFlowEntryById } from './application/usecases/find-cash-flow-entry-by-id/find-cash-flow-entry-by-id.service';
import { RecordPaidBankPaymentCashFlowEntry } from './application/usecases/record-paid-bank-payment-cash-flow-entry/record-paid-bank-payment-cash-flow-entry.service';
import { CashFlowEntryAdminController } from './infra/drivers/http/admin/cash-flow-entry-admin.controller';

@Module({
  imports: [
    CashFlowEntryPersistenceModule,
    AuthenticationGuardsModule,
    CompanyModule,
  ],
  controllers: [
    CashFlowEntryAdminController,
  ],
  providers: [
    CreateCashFlowEntry,
    DeleteCashFlowEntry,
    EditCashFlowEntry,
    FindAllCashFlowEntry,
    FindCashFlowEntryById,
    RecordPaidBankPaymentCashFlowEntry,
  ],
  exports: [
    RecordPaidBankPaymentCashFlowEntry,
  ],
})
export class CashFlowEntryModule {}
