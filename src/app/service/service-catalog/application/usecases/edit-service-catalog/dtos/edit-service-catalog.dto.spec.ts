import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditServiceCatalogInputDto } from './edit-service-catalog.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditServiceCatalogInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some((m) => m.includes(substring))).toBe(true);
}

describe('EditServiceCatalogInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('optional fields', () => {
    it('should accept empty object (all fields optional)', async() => {
      const data = {};

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(EditServiceCatalogInputDto);
    });

    it('should accept partial update with name only', async() => {
      const data = { name: 'Novo nome' };

      const result = await target.transform(data, metadata);

      expect(result.name).toBe('Novo nome');
    });

    it('should accept partial update with unitPriceInCents only', async() => {
      const data = { unitPriceInCents: 5000 };

      const result = await target.transform(data, metadata);

      expect(result.unitPriceInCents).toBe(5000);
    });

    it('should accept partial update with multiple fields', async() => {
      const data = {
        name: 'Serviço atualizado',
        description: 'Nova descrição',
        isCommercial: false,
      };

      const result = await target.transform(data, metadata);

      expect(result.name).toBe('Serviço atualizado');
      expect(result.description).toBe('Nova descrição');
      expect(result.isCommercial).toBe(false);
    });
  });

  describe('name - when provided', () => {
    it('should throw if name is empty string when provided', async() => {
      const data = { name: '' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'name');
      });
    });

    it('should throw if name is only whitespace when provided', async() => {
      const data = { name: '   ' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'name');
      });
    });

    it('should throw if name exceeds 500 characters when provided', async() => {
      const data = { name: 'a'.repeat(501) };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'name deve ter no máximo 500 caracteres');
      });
    });

    it('should trim name when provided', async() => {
      const data = { name: '  Nome editado  ' };

      const result = await target.transform(data, metadata);

      expect(result.name).toBe('Nome editado');
    });
  });

  describe('description - when provided', () => {
    it('should throw if description is empty when provided', async() => {
      const data = { description: '' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'description');
      });
    });

    it('should throw if description exceeds 8192 characters when provided', async() => {
      const data = { description: 'a'.repeat(8193) };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'description deve ter no máximo 8192 caracteres');
      });
    });

    it('should trim description when provided', async() => {
      const data = { description: '  Texto  ' };

      const result = await target.transform(data, metadata);

      expect(result.description).toBe('Texto');
    });
  });

  describe('unitPriceInCents - when provided', () => {
    it('should throw if unitPriceInCents is negative when provided', async() => {
      const data = { unitPriceInCents: -1 };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'unitPriceInCents deve ser maior ou igual a 0');
      });
    });

    it('should throw if unitPriceInCents is not an integer when provided', async() => {
      const data = { unitPriceInCents: 10.5 };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'unitPriceInCents deve ser um número inteiro');
      });
    });

    it('should accept unitPriceInCents zero when provided', async() => {
      const data = { unitPriceInCents: 0 };

      const result = await target.transform(data, metadata);

      expect(result.unitPriceInCents).toBe(0);
    });
  });

  describe('cnaeNbsIndopId - when provided', () => {
    it('should throw if cnaeNbsIndopId is less than 1 when provided', async() => {
      const data = { cnaeNbsIndopId: 0 };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'cnaeNbsIndopId deve ser maior ou igual a 1');
      });
    });
  });

  describe('isCommercial - when provided', () => {
    it('should throw if isCommercial is not boolean (after string transform)', async() => {
      const data = { isCommercial: 'maybe' as unknown as boolean };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'isCommercial deve ser um booleano');
      });
    });

    it('should transform string "false" to boolean when provided', async() => {
      const data = { isCommercial: 'false' as unknown as boolean };

      const result = await target.transform(data, metadata);

      expect(result.isCommercial).toBe(false);
    });
  });

  describe('full update validation', () => {
    it('should pass if all provided fields are valid', async() => {
      const data = {
        cnaeNbsIndopId: 1,
        serviceBilledId: 2,
        serviceCategoryId: 3,
        serviceDeliveryTermId: 4,
        serviceFreightId: 5,
        serviceProposalValidityId: 6,
        serviceWarrantyId: 7,
        name: 'Serviço completo',
        unitPriceInCents: 10000,
        description: 'Descrição do serviço',
        isCommercial: true,
      };

      const result = await target.transform(data, metadata);

      expect(result.name).toBe('Serviço completo');
      expect(result.unitPriceInCents).toBe(10000);
      expect(result.cnaeNbsIndopId).toBe(1);
    });

    it('should fail if any provided field is invalid', async() => {
      const data = {
        name: 'Nome válido',
        unitPriceInCents: -5,
      };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'unitPriceInCents');
      });
    });

    it('should strip properties not in the DTO (whitelist)', async() => {
      const data = { name: 'Ok', extraField: 'ignored' } as EditServiceCatalogInputDto & { extraField: string };

      const result = await target.transform(data, metadata);

      expect((result as unknown as { extraField?: string }).extraField).toBeUndefined();
    });
  });
});
