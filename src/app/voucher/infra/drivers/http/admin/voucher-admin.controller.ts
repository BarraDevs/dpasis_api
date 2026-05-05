import { Controller, Post } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { GenerateManufacturerVouchers } from 'src/app/voucher/application/usecases/generate-manufacturer-vouchers/generate-manufacturer-vouchers.service';
import { GenerateManufacturerVouchersOutputDto } from 'src/app/voucher/application/usecases/generate-manufacturer-vouchers/dtos/generate-manufacturer-vouchers.dto';
import { Swagger } from 'src/infra/openapi/swagger';

@Controller('admin/voucher')
@RequiredRoles(AccountRole.ADMIN)
export class VoucherAdminController {
  constructor(
    private readonly generateManufacturerVouchers: GenerateManufacturerVouchers,
  ) {}

  @Post('generate')
  @RequiredClaims(Claim.VOUCHER_WRITE)
  @Swagger({
    tags: ['Vouchers'],
    summary: 'Gerar vouchers para todas as revendas indicadoras ativas',
    applyBadRequest: true,
    createdResponse: GenerateManufacturerVouchersOutputDto,
  })
  public generate(): Promise<GenerateManufacturerVouchersOutputDto> {
    return this.generateManufacturerVouchers.execute();
  }
}
