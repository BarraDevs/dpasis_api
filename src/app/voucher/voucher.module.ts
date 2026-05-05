import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { VoucherPersistenceModule } from './application/persistence/voucher-persistence.module';
import { GenerateManufacturerVouchers } from './application/usecases/generate-manufacturer-vouchers/generate-manufacturer-vouchers.service';
import { GenerateVoucher } from './application/usecases/generate-voucher/generate-voucher.service';
import { VoucherAdminController } from './infra/drivers/http/admin/voucher-admin.controller';

@Module({
  imports: [
    VoucherPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    VoucherAdminController,
  ],
  providers: [
    GenerateManufacturerVouchers,
    GenerateVoucher,
  ],
})
export class VoucherModule {}
