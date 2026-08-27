import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentModule } from '../../../bank-payment.module';
import { GetBankPaymentPdf } from './get-bank-payment-pdf.service';

describe('GetBankPaymentPdf - Integration tests', () => {
  let sut: GetBankPaymentPdf;
  let gateway: BankPaymentFakeAdapterGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [BankPaymentModule],
    }).compile();

    sut = module.get(GetBankPaymentPdf);
    gateway = module.get(TOKENS.BankPaymentGateway) as BankPaymentFakeAdapterGateway;
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should get PDF via fake gateway', async() => {
    const result = await sut.execute('req-abc', BankPaymentProvider.INTER);

    expect(gateway.getPdfCalls).toEqual([{
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-abc',
    }]);
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-abc',
      pdf: 'JVBERi0xLjQK',
    });
  });
});
