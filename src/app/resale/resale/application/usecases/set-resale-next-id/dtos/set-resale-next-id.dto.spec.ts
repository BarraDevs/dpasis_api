import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
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

  it('should accept positive integer nextId', async() => {
    const result = await pipe.transform({ nextId: 100 }, bodyMetadata);

    expect(result).toBeInstanceOf(SetResaleNextIdInputDto);
    expect(result.nextId).toBe(100);
  });

  it('should reject string nextId (expects number at validation layer)', async() => {
    await expect(pipe.transform({ nextId: '500' }, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject zero', async() => {
    await expect(pipe.transform({ nextId: 0 }, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject negative values', async() => {
    await expect(pipe.transform({ nextId: -1 }, bodyMetadata)).rejects.toBeDefined();
  });

  it('should reject non-integer numbers', async() => {
    await expect(pipe.transform({ nextId: 1.2 }, bodyMetadata)).rejects.toBeDefined();
  });

  it('should fail validate() on plain object without pipe (class-validator direct)', async() => {
    const instance = plainToInstance(SetResaleNextIdInputDto, { nextId: 0 });
    const errors = await validate(instance);

    expect(errors.length).toBeGreaterThan(0);
  });
});
