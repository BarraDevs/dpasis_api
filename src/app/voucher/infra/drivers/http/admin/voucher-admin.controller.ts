import { Body, Controller, Post } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { GenerateVoucherInputDto, GenerateVoucherOutputDto } from 'src/app/voucher/application/usecases/generate-voucher/dtos/generate-voucher.dto';
import { GenerateVoucher } from 'src/app/voucher/application/usecases/generate-voucher/generate-voucher.service';
import { Swagger } from 'src/infra/openapi/swagger';

@Controller('admin/voucher')
@RequiredRoles(AccountRole.ADMIN)
export class VoucherAdminController {
  constructor(
    private readonly generateVoucher: GenerateVoucher,
  ) {}

  @Post('generate-by-id')
  @RequiredClaims(Claim.VOUCHER_WRITE)
  @Swagger({
    tags: ['Vouchers'],
    summary: 'Calcular voucher a partir do id (sequence)',
    applyBadRequest: true,
    okResponse: GenerateVoucherOutputDto,
  })
  public generateById(@Body() body: GenerateVoucherInputDto): Promise<GenerateVoucherOutputDto> {
    return this.generateVoucher.execute(body);
  }
}
