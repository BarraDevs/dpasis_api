import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
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
});
