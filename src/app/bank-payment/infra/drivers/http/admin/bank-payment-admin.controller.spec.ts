import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { BankPaymentDto } from 'src/infra/bank-payment/dtos/bank-payment.dto';
import { BankPaymentPdfDto } from 'src/infra/bank-payment/dtos/bank-payment-pdf.dto';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { CancelBankPayment } from '../../../../application/usecases/cancel-bank-payment/cancel-bank-payment.service';
import { FindBankPayment } from '../../../../application/usecases/find-bank-payment/find-bank-payment.service';
import { GetBankPaymentPdf } from '../../../../application/usecases/get-bank-payment-pdf/get-bank-payment-pdf.service';
import {
  IssueBankPaymentInputDto,
  IssueBankPaymentOutputDto,
} from '../../../../application/usecases/issue-bank-payment/dtos/issue-bank-payment.dto';
import { IssueBankPayment } from '../../../../application/usecases/issue-bank-payment/issue-bank-payment.service';
import { BankPaymentAdminController } from './bank-payment-admin.controller';

describe('BankPaymentAdminController - Unit tests', () => {
  let sut: BankPaymentAdminController;
  let issueBankPayment: IssueBankPayment;
  let findBankPayment: FindBankPayment;
  let getBankPaymentPdf: GetBankPaymentPdf;
  let cancelBankPayment: CancelBankPayment;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [BankPaymentAdminController],
      providers: [
        { provide: IssueBankPayment, useValue: createMock<IssueBankPayment>() },
        { provide: FindBankPayment, useValue: createMock<FindBankPayment>() },
        { provide: GetBankPaymentPdf, useValue: createMock<GetBankPaymentPdf>() },
        { provide: CancelBankPayment, useValue: createMock<CancelBankPayment>() },
      ],
    }).compile();

    sut = module.get(BankPaymentAdminController);
    issueBankPayment = module.get(IssueBankPayment);
    findBankPayment = module.get(FindBankPayment);
    getBankPaymentPdf = module.get(GetBankPaymentPdf);
    cancelBankPayment = module.get(CancelBankPayment);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call issueBankPayment.execute', async() => {
    const body = createMock<IssueBankPaymentInputDto>();
    const output = createMock<IssueBankPaymentOutputDto>();
    const spy = jest.spyOn(issueBankPayment, 'execute').mockResolvedValue(output);

    const result = await sut.issue(body);

    expect(spy).toHaveBeenCalledWith(body);
    expect(result).toBe(output);
  });

  it('should call findBankPayment.execute', async() => {
    const output = createMock<BankPaymentDto>();
    const spy = jest.spyOn(findBankPayment, 'execute').mockResolvedValue(output);

    const result = await sut.findOne(
      { codigoSolicitacao: 'req-1' },
      { provider: BankPaymentProvider.INTER },
    );

    expect(spy).toHaveBeenCalledWith('req-1', BankPaymentProvider.INTER);
    expect(result).toBe(output);
  });

  it('should call getBankPaymentPdf.execute', async() => {
    const output = createMock<BankPaymentPdfDto>();
    const spy = jest.spyOn(getBankPaymentPdf, 'execute').mockResolvedValue(output);

    const result = await sut.getPdf(
      { codigoSolicitacao: 'req-1' },
      { provider: BankPaymentProvider.INTER },
    );

    expect(spy).toHaveBeenCalledWith('req-1', BankPaymentProvider.INTER);
    expect(result).toBe(output);
  });

  it('should call cancelBankPayment.execute', async() => {
    const output: SuccessMessage = { message: 'ok' };
    const spy = jest.spyOn(cancelBankPayment, 'execute').mockResolvedValue(output);

    const result = await sut.cancel(
      { codigoSolicitacao: 'req-1' },
      { provider: BankPaymentProvider.INTER, reason: 'Cliente pediu o cancelamento' },
    );

    expect(spy).toHaveBeenCalledWith('req-1', {
      provider: BankPaymentProvider.INTER,
      reason: 'Cliente pediu o cancelamento',
    });
    expect(result).toBe(output);
  });
});
