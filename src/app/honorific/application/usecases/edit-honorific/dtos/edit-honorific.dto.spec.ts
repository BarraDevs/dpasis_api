import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditHonorificInputDto } from './edit-honorific.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditHonorificInputDto,
};

function makeValidInputDto(overrides: Partial<EditHonorificInputDto> = {}): EditHonorificInputDto {
  return {
    ...overrides,
  };
}

describe('EditHonorificInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it.each([
    123,
    true,
  ])('should throw when name is not a string (%s)', async(value: any) => {
    const data = makeValidInputDto({ name: value });

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      expect(error.getResponse().message).toContain('name deve ser uma string');
    });
  });

  it('should allow empty body', async() => {
    const result = await target.transform(makeValidInputDto(), metadata);
    expect(result).toBeInstanceOf(EditHonorificInputDto);
  });

  it('should trim name when present', async() => {
    const result = await target.transform(makeValidInputDto({ name: '  Sra.  ' }), metadata);
    expect(result.name).toBe('Sra.');
  });
});
