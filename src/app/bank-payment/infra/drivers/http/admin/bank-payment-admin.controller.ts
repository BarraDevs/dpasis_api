import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { BankPaymentDto } from 'src/infra/bank-payment/dtos/bank-payment.dto';
import { BankPaymentPdfDto } from 'src/infra/bank-payment/dtos/bank-payment-pdf.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { CancelBankPayment } from '../../../../application/usecases/cancel-bank-payment/cancel-bank-payment.service';
import { CancelBankPaymentInputDto } from '../../../../application/usecases/cancel-bank-payment/dtos/cancel-bank-payment.dto';
import {
  BankPaymentRequestCodeParams,
  FindBankPaymentQueryDto,
} from '../../../../application/usecases/find-bank-payment/dtos/find-bank-payment.dto';
import { FindBankPayment } from '../../../../application/usecases/find-bank-payment/find-bank-payment.service';
import { GetBankPaymentPdf } from '../../../../application/usecases/get-bank-payment-pdf/get-bank-payment-pdf.service';
import {
  IssueBankPaymentInputDto,
  IssueBankPaymentOutputDto,
} from '../../../../application/usecases/issue-bank-payment/dtos/issue-bank-payment.dto';
import { IssueBankPayment } from '../../../../application/usecases/issue-bank-payment/issue-bank-payment.service';

@Controller('admin/bank-payment')
@RequiredRoles(AccountRole.ADMIN)
export class BankPaymentAdminController {
  constructor(
    private readonly issueBankPayment: IssueBankPayment,
    private readonly findBankPayment: FindBankPayment,
    private readonly getBankPaymentPdf: GetBankPaymentPdf,
    private readonly cancelBankPayment: CancelBankPayment,
  ) {}

  @Post()
  @RequiredClaims(Claim.BANK_PAYMENT_WRITE)
  @Swagger({
    tags: ['Cobrança bancária'],
    summary: 'Emitir cobrança (boleto com Pix)',
    applyBadRequest: true,
    applyServiceUnavailable: true,
    createdResponse: IssueBankPaymentOutputDto,
  })
  public issue(@Body() body: IssueBankPaymentInputDto): Promise<IssueBankPaymentOutputDto> {
    return this.issueBankPayment.execute(body);
  }

  @Get(':codigoSolicitacao/pdf')
  @RequiredClaims(Claim.BANK_PAYMENT_READ)
  @Swagger({
    tags: ['Cobrança bancária'],
    summary: 'Recuperar PDF da cobrança (base64)',
    applyBadRequest: true,
    applyNotFound: true,
    applyServiceUnavailable: true,
    okResponse: BankPaymentPdfDto,
  })
  public getPdf(
    @Param() params: BankPaymentRequestCodeParams,
    @Query() query: FindBankPaymentQueryDto,
  ): Promise<BankPaymentPdfDto> {
    return this.getBankPaymentPdf.execute(params.codigoSolicitacao, query.provider);
  }

  @Get(':codigoSolicitacao')
  @RequiredClaims(Claim.BANK_PAYMENT_READ)
  @Swagger({
    tags: ['Cobrança bancária'],
    summary: 'Recuperar cobrança pelo código de solicitação',
    applyBadRequest: true,
    applyNotFound: true,
    applyServiceUnavailable: true,
    okResponse: BankPaymentDto,
  })
  public findOne(
    @Param() params: BankPaymentRequestCodeParams,
    @Query() query: FindBankPaymentQueryDto,
  ): Promise<BankPaymentDto> {
    return this.findBankPayment.execute(params.codigoSolicitacao, query.provider);
  }

  @Post(':codigoSolicitacao/cancel')
  @RequiredClaims(Claim.BANK_PAYMENT_WRITE)
  @Swagger({
    tags: ['Cobrança bancária'],
    summary: 'Cancelar cobrança',
    applyBadRequest: true,
    applyNotFound: true,
    applyServiceUnavailable: true,
    okResponse: SuccessMessage,
  })
  public cancel(
    @Param() params: BankPaymentRequestCodeParams,
    @Body() body: CancelBankPaymentInputDto,
  ): Promise<SuccessMessage> {
    return this.cancelBankPayment.execute(params.codigoSolicitacao, body);
  }
}
