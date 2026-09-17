import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateCashFlowEntryInputDto } from './create-cash-flow-entry.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateCashFlowEntryInputDto,
};

function makeValidInputDto(
  overrides: Partial<CreateCashFlowEntryInputDto> = {},
): CreateCashFlowEntryInputDto {
  return {
    companyId: 1,
    type: CashFlowEntryType.CREDIT,
    amountInCents: 15050,
    occurredAt: '2026-09-17T12:00:00.000Z',
    description: 'Pagamento de boleto',
    ...overrides,
  };
}

describe('CreateCashFlowEntryInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept a valid payload', async() => {
    const result = await target.transform(makeValidInputDto(), metadata);

    expect(result).toEqual(makeValidInputDto());
  });

  it.each([undefined, null, ''])('should reject empty description (%s)', async(value: any) => {
    expect.assertions(1);
    return target.transform(makeValidInputDto({ description: value }), metadata).catch((error) => {
      expect(error.getResponse().message).toContain('description é obrigatório');
    });
  });

  it('should trim description', async() => {
    const result = await target.transform(makeValidInputDto({ description: '  texto  ' }), metadata);

    expect(result.description).toBe('texto');
  });

  it('should reject amountInCents below 1', async() => {
    expect.assertions(1);
    return target.transform(makeValidInputDto({ amountInCents: 0 }), metadata).catch((error) => {
      expect(error.getResponse().message).toContain('amountInCents deve ser maior que zero');
    });
  });

  it('should reject invalid type', async() => {
    expect.assertions(1);
    return target.transform(makeValidInputDto({ type: 'PIX' as any }), metadata).catch((error) => {
      expect(error.getResponse().message).toContain('type deve ser CREDIT ou DEBIT');
    });
  });

  it('should reject invalid occurredAt', async() => {
    expect.assertions(1);
    return target.transform(makeValidInputDto({ occurredAt: 'not-a-date' }), metadata).catch((error) => {
      expect(error.getResponse().message).toContain('occurredAt deve ser uma data válida no formato ISO 8601');
    });
  });
});
