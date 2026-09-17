import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllCashFlowEntryQueryDto } from './find-all-cash-flow-entry.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllCashFlowEntryQueryDto,
};

function makeValidQueryDto(
  overrides: Partial<FindAllCashFlowEntryQueryDto> = {},
): FindAllCashFlowEntryQueryDto {
  return {
    companyId: 1,
    ...overrides,
  } as FindAllCashFlowEntryQueryDto;
}

describe('FindAllCashFlowEntryQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should require companyId', async() => {
    expect.assertions(1);
    return target.transform({}, metadata).catch((error) => {
      expect(error.getResponse().message).toEqual(
        expect.arrayContaining([expect.stringContaining('companyId')]),
      );
    });
  });

  it('should transform string companyId to number', async() => {
    const result = await target.transform({ companyId: '5' }, metadata);

    expect(result.companyId).toBe(5);
  });

  it('should accept period and type filters', async() => {
    const result = await target.transform(
      makeValidQueryDto({
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        type: CashFlowEntryType.DEBIT,
      }),
      metadata,
    );

    expect(result.startDate).toBe('2026-09-01');
    expect(result.endDate).toBe('2026-09-30');
    expect(result.type).toBe(CashFlowEntryType.DEBIT);
  });

  it('should reject invalid startDate', async() => {
    expect.assertions(1);
    return target.transform(makeValidQueryDto({ startDate: 'nope' }), metadata).catch((error) => {
      expect(error.getResponse().message).toContain(
        'startDate deve ser uma data válida no formato ISO 8601',
      );
    });
  });
});
