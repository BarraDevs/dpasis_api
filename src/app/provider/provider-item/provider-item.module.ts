import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { BankModule } from 'src/app/global/bank/bank.module';
import { ProviderModule } from 'src/app/provider/provider/provider.module';
import { ProviderItemPersistenceModule } from './application/persistence/provider-item-persistence.module';
import { ActivateProviderItem } from './application/usecases/activate-provider-item/activate-provider-item.service';
import { CreateProviderItem } from './application/usecases/create-provider-item/create-provider-item.service';
import { DeactivateProviderItem } from './application/usecases/deactivate-provider-item/deactivate-provider-item.service';
import { DeleteProviderItem } from './application/usecases/delete-provider-item/delete-provider-item.service';
import { EditProviderItem } from './application/usecases/edit-provider-item/edit-provider-item.service';
import { FindAllProviderItem } from './application/usecases/find-all-provider-item/find-all-provider-item.service';
import { FindProviderItemById } from './application/usecases/find-provider-item-by-id/find-provider-item-by-id.service';
import { PayProviderItemInstallment } from './application/usecases/pay-provider-item-installment/pay-provider-item-installment.service';
import { ProviderItemAdminController } from './infra/drivers/http/admin/provider-item-admin.controller';

@Module({
  imports: [
    ProviderItemPersistenceModule,
    ProviderModule,
    BankModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    ProviderItemAdminController,
  ],
  providers: [
    CreateProviderItem,
    EditProviderItem,
    PayProviderItemInstallment,
    FindAllProviderItem,
    FindProviderItemById,
    ActivateProviderItem,
    DeactivateProviderItem,
    DeleteProviderItem,
  ],
  exports: [
    FindProviderItemById,
  ],
})
export class ProviderItemModule {}
