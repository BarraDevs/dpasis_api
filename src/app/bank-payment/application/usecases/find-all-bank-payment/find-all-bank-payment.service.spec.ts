import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ResolveBankIntegrationCredentials } from 'src/app/global/bank/application/usecases/resolve-bank-integration-credentials/resolve-bank-integration-credentials.service';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { BankPaymentPersonType } from 'src/infra/bank-payment/enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { FindAllBankPayment } from './find-all-bank-payment.service';
import { makeBankPaymentCredentials } from 'src/test/fixtures/bank-payment-credentials';

describe('FindAllBankPayment - Unit tests', () => {
  let sut: FindAllBankPayment;
  let gateway: IBankPaymentGateway;
  const credentials = makeBankPaymentCredentials();

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllBankPayment,
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

    sut = module.get(FindAllBankPayment);
    gateway = module.get(TOKENS.BankPaymentGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call gateway.list with defaults and return pagination', async() => {
    const listSpy = jest.spyOn(gateway, 'list').mockResolvedValue({
      items: [{
        provider: BankPaymentProvider.INTER,
        requestCode: 'req-1',
        yourNumber: 'INV-1',
        status: BankPaymentStatus.EMITTED,
        amount: 10,
        dueDate: '2026-09-01',
        payer: {
          document: '1',
          personType: BankPaymentPersonType.INDIVIDUAL,
          name: 'A',
        },
      }],
      total: 1,
    });

    const result = await sut.execute({
      provider: BankPaymentProvider.INTER,
      bankId: 1,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });

    expect(listSpy).toHaveBeenCalledWith({
      provider: BankPaymentProvider.INTER,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      status: undefined,
      payerName: undefined,
      payerDocument: undefined,
      page: 1,
      size: 100,
      credentials,
    });
    expect(result).toEqual({
      currentPage: 1,
      itemsPerPage: 100,
      totalItems: 1,
      totalPages: 1,
      data: expect.arrayContaining([
        expect.objectContaining({ requestCode: 'req-1' }),
      ]),
    });
  });

  it('should forward optional filters and pagination', async() => {
    const listSpy = jest.spyOn(gateway, 'list').mockResolvedValue({
      items: [],
      total: 0,
    });

    await sut.execute({
      provider: BankPaymentProvider.INTER,
      bankId: 1,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      status: BankPaymentStatus.EMITTED,
      payerName: 'João',
      payerDocument: '11122233344',
      page: 2,
      size: 20,
    });

    expect(listSpy).toHaveBeenCalledWith({
      provider: BankPaymentProvider.INTER,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      status: BankPaymentStatus.EMITTED,
      payerName: 'João',
      payerDocument: '11122233344',
      page: 2,
      size: 20,
      credentials,
    });
  });
});
