import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { EditProviderInputDto } from './edit-provider.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditProviderInputDto,
};

describe('EditProviderInputDto - Unit tests', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept partial body', async() => {
    const result = await target.transform({ name: 'Novo Nome' }, metadata);

    expect(result.name).toBe('Novo Nome');
  });

  it('should validate paymentDate when type is RECURRING in partial edit', async() => {
    const result = await target.transform({
      type: ProviderType.RECURRING,
      paymentDate: 10,
    }, metadata);

    expect(result.paymentDate).toBe(10);
  });
});
