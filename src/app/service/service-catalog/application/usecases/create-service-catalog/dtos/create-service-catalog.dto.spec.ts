import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateServiceCatalogInputDto } from './create-service-catalog.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateServiceCatalogInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

function makeValidData(overrides?: Partial<CreateServiceCatalogInputDto>): CreateServiceCatalogInputDto {
  return {
    cnaeNbsIndopId: 1,
    billedId: 2,
    categoryId: 3,
    deliveryTermId: 4,
    freightId: 5,
    proposalValidityId: 6,
    warrantyId: 7,
    companyIds: [1],
    name: 'Instalação de sistema',
    unitPriceInCents: 150000,
    description: 'Descrição do serviço ofertado.',
    isCommercial: true,
    ...overrides,
  };
}

const positiveIntFkFields = [
  'cnaeNbsIndopId',
  'billedId',
  'categoryId',
  'deliveryTermId',
  'freightId',
  'proposalValidityId',
  'warrantyId',
] as const;

describe('CreateServiceCatalogInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('foreign key id fields (integer >= 1)', () => {
    it.each(positiveIntFkFields)(
      'should throw if %s is missing',
      async(field) => {
        const data = { ...makeValidData(), [field]: undefined };

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, `${field} é obrigatório`);
        });
      },
    );

    it.each(positiveIntFkFields)(
      'should throw if %s is not an integer',
      async(field) => {
        const data = { ...makeValidData(), [field]: 1.5 };

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, `${field} deve ser um número inteiro`);
        });
      },
    );

    it.each(positiveIntFkFields)(
      'should throw if %s is less than 1',
      async(field) => {
        const data = { ...makeValidData(), [field]: 0 };

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, `${field} deve ser maior ou igual a 1`);
        });
      },
    );

    it('should throw if foreign key ids are sent as strings (no StringToNumber on DTO)', async() => {
      const data = { ...makeValidData(), cnaeNbsIndopId: '10' as unknown as number };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'cnaeNbsIndopId deve ser um número inteiro');
      });
    });
  });

  describe('companyIds', () => {
    it.each([undefined, null])('should throw if companyIds is empty (%s)', async(value: unknown) => {
      const data = makeValidData({ companyIds: value as number[] });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'companyIds');
      });
    });

    it('should throw if companyIds is empty array', async() => {
      const data = makeValidData({ companyIds: [] });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'companyIds');
      });
    });

    it('should accept valid companyIds', async() => {
      const data = makeValidData({ companyIds: [1, 2, 3] });

      const result = await target.transform(data, metadata);

      expect(result.companyIds).toEqual([1, 2, 3]);
    });
  });

  describe('name', () => {
    it.each([undefined, null, '', '   '])(
      'should throw if name is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ name: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'name é obrigatório');
        });
      },
    );

    it.each([123, true, false, {}, []])(
      'should throw if name is not a string (%s)',
      async(value: unknown) => {
        const data = makeValidData({ name: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'name deve ser uma string');
        });
      },
    );

    it('should throw if name exceeds 500 characters', async() => {
      const data = makeValidData({ name: 'a'.repeat(501) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'name deve ter no máximo 500 caracteres');
      });
    });

    it('should trim name', async() => {
      const data = makeValidData({ name: '  Nome do serviço  ' });

      const result = await target.transform(data, metadata);

      expect(result.name).toBe('Nome do serviço');
    });

    it('should accept name with 500 characters', async() => {
      const name = 'a'.repeat(500);
      const data = makeValidData({ name });

      const result = await target.transform(data, metadata);

      expect(result.name).toBe(name);
    });
  });

  describe('unitPriceInCents', () => {
    it('should throw if unitPriceInCents is not an integer', async() => {
      const data = makeValidData({ unitPriceInCents: 10.5 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'unitPriceInCents deve ser um número inteiro');
      });
    });

    it('should throw if unitPriceInCents is negative', async() => {
      const data = makeValidData({ unitPriceInCents: -1 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'unitPriceInCents deve ser maior ou igual a 0');
      });
    });

    it('should accept unitPriceInCents zero', async() => {
      const data = makeValidData({ unitPriceInCents: 0 });

      const result = await target.transform(data, metadata);

      expect(result.unitPriceInCents).toBe(0);
    });

    it('should throw if unitPriceInCents is sent as string', async() => {
      const data = { ...makeValidData(), unitPriceInCents: '999' as unknown as number };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'unitPriceInCents deve ser um número inteiro');
      });
    });
  });

  describe('description', () => {
    it.each([undefined, null, '', '   '])(
      'should throw if description is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ description: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'description é obrigatório');
        });
      },
    );

    it.each([123, true, false, {}, []])(
      'should throw if description is not a string (%s)',
      async(value: unknown) => {
        const data = makeValidData({ description: value as string });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'description deve ser uma string');
        });
      },
    );

    it('should throw if description exceeds 8192 characters', async() => {
      const data = makeValidData({ description: 'a'.repeat(8193) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'description deve ter no máximo 8192 caracteres');
      });
    });

    it('should accept description with 8192 characters', async() => {
      const description = 'a'.repeat(8192);
      const data = makeValidData({ description });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe(description);
    });

    it('should trim description', async() => {
      const data = makeValidData({ description: '  Texto da descrição  ' });

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Texto da descrição');
    });
  });

  describe('isCommercial', () => {
    it.each([undefined, null])(
      'should throw if isCommercial is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ isCommercial: value as boolean });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'isCommercial');
        });
      },
    );

    it('should throw if isCommercial is not boolean (after string transform)', async() => {
      const data = makeValidData({ isCommercial: 'yes' as unknown as boolean });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'isCommercial deve ser um booleano');
      });
    });

    it('should transform string "true" to boolean true', async() => {
      const data = { ...makeValidData(), isCommercial: 'true' as unknown as boolean };

      const result = await target.transform(data, metadata);

      expect(result.isCommercial).toBe(true);
    });

    it('should transform string "false" to boolean false', async() => {
      const data = { ...makeValidData(), isCommercial: 'false' as unknown as boolean };

      const result = await target.transform(data, metadata);

      expect(result.isCommercial).toBe(false);
    });

    it('should accept isCommercial false', async() => {
      const data = makeValidData({ isCommercial: false });

      const result = await target.transform(data, metadata);

      expect(result.isCommercial).toBe(false);
    });
  });

  describe('full payload', () => {
    it('should pass if all fields are valid', async() => {
      const data = makeValidData();

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(CreateServiceCatalogInputDto);
      expect(result.name).toBe('Instalação de sistema');
      expect(result.unitPriceInCents).toBe(150000);
      expect(result.isCommercial).toBe(true);
    });

    it('should strip properties not in the DTO (whitelist)', async() => {
      const data = { ...makeValidData(), extraField: 'ignored' } as CreateServiceCatalogInputDto & {
        extraField: string;
      };

      const result = await target.transform(data, metadata);

      expect((result as unknown as { extraField?: string }).extraField).toBeUndefined();
    });
  });
});
