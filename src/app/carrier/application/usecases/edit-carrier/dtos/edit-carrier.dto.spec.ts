import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditCarrierInputDto } from './edit-carrier.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditCarrierInputDto,
};

describe('EditCarrierInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept empty body (all fields optional)', async() => {
    const result = await target.transform({}, metadata);

    expect(result).toEqual({});
  });

  it('should trim name when provided', async() => {
    const result = await target.transform({ name: '  Nova Transportadora  ' }, metadata);

    expect(result.name).toBe('Nova Transportadora');
  });
});
