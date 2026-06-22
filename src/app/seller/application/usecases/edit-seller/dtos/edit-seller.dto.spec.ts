import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditSellerInputDto } from './edit-seller.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditSellerInputDto,
};

describe('EditSellerInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept empty body (partial update)', async() => {
    const result = await target.transform({}, metadata);

    expect(result).toBeInstanceOf(EditSellerInputDto);
  });

  it('should validate email when provided', async() => {
    expect.assertions(1);
    return target.transform({ email: 'invalid' }, metadata).catch((error) => {
      const messages = error.getResponse().message;
      const list = Array.isArray(messages) ? messages : [messages];
      expect(list.some((m: string) => m.includes('email'))).toBe(true);
    });
  });
});
