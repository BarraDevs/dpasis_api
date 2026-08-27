import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { GetBankPaymentPdf } from './get-bank-payment-pdf.service';

describe('GetBankPaymentPdf - Unit tests', () => {
  let sut: GetBankPaymentPdf;
  let gateway: IBankPaymentGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        GetBankPaymentPdf,
        {
          provide: TOKENS.BankPaymentGateway,
          useValue: createMock<IBankPaymentGateway>(),
        },
      ],
    }).compile();

    sut = module.get(GetBankPaymentPdf);
    gateway = module.get(TOKENS.BankPaymentGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call gateway.getPdf with provider and requestCode', async() => {
    const getPdfSpy = jest.spyOn(gateway, 'getPdf').mockResolvedValue({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-1',
      pdf: 'JVBERi0xLjQK',
    });

    const result = await sut.execute('req-1', BankPaymentProvider.INTER);

    expect(getPdfSpy).toHaveBeenCalledWith({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-1',
    });
    expect(result.pdf).toBe('JVBERi0xLjQK');
  });
});
