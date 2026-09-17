import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { CashFlowEntryType } from 'src/app/cash-flow-entry/domain/enums/cash-flow-entry-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditCashFlowEntryInputDto } from './edit-cash-flow-entry.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditCashFlowEntryInputDto,
};

describe('EditCashFlowEntryInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should pass with empty object', async() => {
    const result = await target.transform({}, metadata);

    expect(result).toBeInstanceOf(EditCashFlowEntryInputDto);
  });

  it('should accept a partial update', async() => {
    const result = await target.transform({ description: 'Ajuste' }, metadata);

    expect(result.description).toBe('Ajuste');
    expect(result.type).toBeUndefined();
  });

  it('should reject invalid type', async() => {
    expect.assertions(1);
    return target.transform({ type: 'PIX' }, metadata).catch((error) => {
      expect(error.getResponse().message).toContain('type deve ser CREDIT ou DEBIT');
    });
  });

  it('should accept CREDIT type', async() => {
    const result = await target.transform({ type: CashFlowEntryType.CREDIT }, metadata);

    expect(result.type).toBe(CashFlowEntryType.CREDIT);
  });
});
