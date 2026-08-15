import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateCnaeNbsIndopInputDto } from './create-cnae-nbs-indop.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateCnaeNbsIndopInputDto,
};

function makeValidInputDto(overrides: Partial<CreateCnaeNbsIndopInputDto> = {}): CreateCnaeNbsIndopInputDto {
  return {
    cnaeId: 1,
    nbsId: 1,
    indopId: 1,
    serviceListItemCode: '01.07',
    ...overrides,
  };
}

describe('CreateCnaeNbsIndopInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should pass when all fields are valid', async() => {
    const data = makeValidInputDto();
    const result = await target.transform(data, metadata);
    expect(result).toBeInstanceOf(CreateCnaeNbsIndopInputDto);
    expect(result.serviceListItemCode).toBe('01.07');
  });

  it('should trim serviceListItemCode', async() => {
    const data = makeValidInputDto({ serviceListItemCode: '  01.07  ' });
    const result = await target.transform(data, metadata);
    expect(result.serviceListItemCode).toBe('01.07');
  });

  it.each([undefined, null, ''])(
    'should reject empty serviceListItemCode (%s)',
    async(value: unknown) => {
      const data = makeValidInputDto({ serviceListItemCode: value as string });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message as string[];
        expect(message.some((m: string) => m.includes('serviceListItemCode'))).toBe(true);
      });
    },
  );

  it('should reject serviceListItemCode longer than 10 characters', async() => {
    const data = makeValidInputDto({ serviceListItemCode: '12345678901' });

    expect.assertions(1);
    return target.transform(data, metadata).catch((error) => {
      const message = error.getResponse().message as string[];
      expect(message).toContain('serviceListItemCode deve ter no máximo 10 caracteres');
    });
  });
});
