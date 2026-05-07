import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { SetResaleNextIdInputDto } from './set-resale-next-id.dto';

const bodyMetadata: ArgumentMetadata = {
  type: 'body',
  metatype: SetResaleNextIdInputDto,
};

describe('SetResaleNextIdInputDto', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe(pipeOptions);
  });

  it('should accept valid hexadecimal nextId string', async() => {
    const result = await pipe.transform({ nextId: '64' }, bodyMetadata);

    expect(result).toBeInstanceOf(SetResaleNextIdInputDto);
    expect(result.nextId).toBe('64');
  });

  it('should accept nextId with 0x prefix', async() => {
    const result = await pipe.transform({ nextId: '0x43' }, bodyMetadata);

    expect(result.nextId).toBe('0x43');
  });

  it('should trim whitespace', async() => {
    const result = await pipe.transform({ nextId: '  43  ' }, bodyMetadata);

    expect(result.nextId).toBe('43');
  });

  it('should reject plain decimal digit-only string that is not valid hex interpretation edge cases', async() => {
    await expect(pipe.transform({ nextId: '' }, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject invalid hex characters', async() => {
    await expect(pipe.transform({ nextId: 'GG' }, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject more than 8 hex digits', async() => {
    await expect(pipe.transform({ nextId: '123456789' }, bodyMetadata)).rejects.toBeDefined();
  });
});
