import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ResolveBankIntegrationCredentials } from 'src/app/global/bank/application/usecases/resolve-bank-integration-credentials/resolve-bank-integration-credentials.service';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { makeBankPaymentCredentials } from 'src/test/fixtures/bank-payment-credentials';
import { GetBankPaymentPdf } from './get-bank-payment-pdf.service';

describe('GetBankPaymentPdf - Unit tests', () => {
  let sut: GetBankPaymentPdf;
  let gateway: IBankPaymentGateway;
  const credentials = makeBankPaymentCredentials();

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        GetBankPaymentPdf,
        {
          provide: TOKENS.BankPaymentGateway,
          useValue: createMock<IBankPaymentGateway>(),
        },
        {
          provide: ResolveBankIntegrationCredentials,
          useValue: createMock<ResolveBankIntegrationCredentials>({
            execute: jest.fn().mockResolvedValue(credentials),
          }),
        },
      ],
    }).compile();

    sut = module.get(GetBankPaymentPdf);
    gateway = module.get(TOKENS.BankPaymentGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call gateway.getPdf with provider, requestCode and credentials', async() => {
    const getPdfSpy = jest.spyOn(gateway, 'getPdf').mockResolvedValue({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-1',
      pdf: 'JVBERi0xLjQK',
    });

    const result = await sut.execute('req-1', BankPaymentProvider.INTER, 1);

    expect(getPdfSpy).toHaveBeenCalledWith({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-1',
      credentials,
    });
    expect(result.pdf).toBe('JVBERi0xLjQK');
  });
});
