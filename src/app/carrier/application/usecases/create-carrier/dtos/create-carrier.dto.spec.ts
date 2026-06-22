import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateCarrierInputDto } from './create-carrier.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateCarrierInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

function makeValidInputDto(overrides: Partial<CreateCarrierInputDto> = {}): CreateCarrierInputDto {
  return {
    name: 'Transportadora LTDA',
    fantasyName: 'Transportadora',
    representative: 'João Silva',
    document: '09.748.165/0001-10',
    contact: 'João Silva - (11) 99999-9999',
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    ...overrides,
  };
}

describe('CreateCarrierInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('name field', () => {
    it.each([undefined, null, '', '  '])('should throw if name is empty (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ name: value as string });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'name');
      });
    });

    it('should trim name', async() => {
      const data = makeValidInputDto({ name: '  Transportadora LTDA  ' });

      const result = await target.transform(data, metadata);

      expect(result.name).toBe('Transportadora LTDA');
    });
  });

  describe('representative field', () => {
    it.each([undefined, null, '', '  '])(
      'should throw if representative is empty (%s)',
      async(value: unknown) => {
        const data = makeValidInputDto({ representative: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'representative');
        });
      },
    );
  });

  describe('contact field', () => {
    it.each([undefined, null, '', '  '])(
      'should throw if contact is empty (%s)',
      async(value: unknown) => {
        const data = makeValidInputDto({ contact: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'contact');
        });
      },
    );
  });

  it('should accept valid input', async() => {
    const data = makeValidInputDto();

    const result = await target.transform(data, metadata);

    expect(result).toEqual(data);
  });
});
