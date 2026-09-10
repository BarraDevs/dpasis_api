import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { BankPaymentDto } from 'src/infra/bank-payment/dtos/bank-payment.dto';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { FindBankPaymentByYourNumber } from './find-bank-payment-by-your-number.service';

function makeItem(overrides: Partial<BankPaymentDto> = {}): BankPaymentDto {
  return createMock<BankPaymentDto>({
    provider: BankPaymentProvider.INTER,
    requestCode: 'req-1',
    yourNumber: '42',
    amount: 1000,
    dueDate: '2026-08-15',
    status: BankPaymentStatus.EMITTED,
    ...overrides,
  });
}

const input = {
  provider: BankPaymentProvider.INTER,
  yourNumber: '42',
  amount: 1000,
  dueDate: '2026-08-15',
};

describe('FindBankPaymentByYourNumber - Unit tests', () => {
  let sut: FindBankPaymentByYourNumber;
  let gateway: IBankPaymentGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindBankPaymentByYourNumber,
        { provide: TOKENS.BankPaymentGateway, useValue: createMock<IBankPaymentGateway>() },
      ],
    }).compile();

    sut = module.get(FindBankPaymentByYourNumber);
    gateway = module.get(TOKENS.BankPaymentGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should query the provider filtering by seuNumero and the frozen due date', async() => {
    // Arrange
    jest.spyOn(gateway, 'list').mockResolvedValue({ items: [makeItem()], total: 1 });

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(gateway.list).toHaveBeenCalledWith({
      provider: BankPaymentProvider.INTER,
      startDate: '2026-08-15',
      endDate: '2026-08-15',
      yourNumber: '42',
      page: 1,
      size: 100,
    });
    expect(result?.requestCode).toBe('req-1');
  });

  it('should ignore a charge with a different amount', async() => {
    // Arrange
    jest.spyOn(gateway, 'list').mockResolvedValue({ items: [makeItem({ amount: 999 })], total: 1 });

    // Act & Assert
    await expect(sut.execute(input)).resolves.toBeNull();
  });

  it('should ignore a charge with a different due date', async() => {
    // Arrange
    jest.spyOn(gateway, 'list').mockResolvedValue({ items: [makeItem({ dueDate: '2026-09-15' })], total: 1 });

    // Act & Assert
    await expect(sut.execute(input)).resolves.toBeNull();
  });

  it('should ignore a cancelled charge so reissuing stays possible', async() => {
    // Arrange
    jest.spyOn(gateway, 'list')
      .mockResolvedValue({ items: [makeItem({ status: BankPaymentStatus.CANCELLED })], total: 1 });

    // Act & Assert
    await expect(sut.execute(input)).resolves.toBeNull();
  });

  it('should ignore a failed charge: it never became a payable boleto', async() => {
    // Arrange — `FALHA_EMISSAO`. Contá-la como existente vinculava de novo a cobrança com falha e
    // travava a reemissão do boleto.
    jest.spyOn(gateway, 'list')
      .mockResolvedValue({ items: [makeItem({ status: BankPaymentStatus.FAILED })], total: 1 });

    // Act & Assert
    await expect(sut.execute(input)).resolves.toBeNull();
  });

  it('should still find the live charge when a failed one shares the same key', async() => {
    // Arrange
    jest.spyOn(gateway, 'list').mockResolvedValue({
      items: [
        makeItem({ requestCode: 'req-failed', status: BankPaymentStatus.FAILED }),
        makeItem({ requestCode: 'req-live', status: BankPaymentStatus.EMITTED }),
      ],
      total: 2,
    });

    // Act & Assert
    await expect(sut.execute(input)).resolves.toMatchObject({ requestCode: 'req-live' });
  });

  it('should return null when the provider knows nothing about the key', async() => {
    // Arrange
    jest.spyOn(gateway, 'list').mockResolvedValue({ items: [], total: 0 });

    // Act & Assert
    await expect(sut.execute(input)).resolves.toBeNull();
  });

  it('should ignore a charge with a different yourNumber', async() => {
    // Arrange
    jest.spyOn(gateway, 'list').mockResolvedValue({ items: [makeItem({ yourNumber: '99' })], total: 1 });

    // Act & Assert
    await expect(sut.execute(input)).resolves.toBeNull();
  });

  it('should treat a paid charge as existing: the provider already knows this key', async() => {
    // Arrange
    jest.spyOn(gateway, 'list')
      .mockResolvedValue({ items: [makeItem({ status: BankPaymentStatus.PAID })], total: 1 });

    // Act & Assert
    await expect(sut.execute(input)).resolves.toMatchObject({ requestCode: 'req-1' });
  });
});
