import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditClientTypeInputDto } from './edit-client-type.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditClientTypeInputDto,
};

describe('EditClientTypeInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept empty object (all fields optional)', async() => {
    const data = {};

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditClientTypeInputDto);
  });

  it('should accept partial update with quantity only', async() => {
    const data = { quantity: 10 };

    const result = await target.transform(data, metadata);

    expect(result.quantity).toBe(10);
  });

  it('should accept partial update with multiple fields', async() => {
    const data = {
      clientSystemTypeId: 2,
      clientDriveTypeId: 3,
      quantity: 15,
    };

    const result = await target.transform(data, metadata);

    expect(result.clientSystemTypeId).toBe(2);
    expect(result.clientDriveTypeId).toBe(3);
    expect(result.quantity).toBe(15);
  });

  it('should not include clientId (omitted from edit)', async() => {
    const data = { quantity: 5 };

    const result = await target.transform(data, metadata);

    expect(result).not.toHaveProperty('clientId');
  });
});
