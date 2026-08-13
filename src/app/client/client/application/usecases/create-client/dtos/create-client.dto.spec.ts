import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateClientInputDto } from './create-client.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateClientInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some(m => m.includes(substring))).toBe(true);
}

function makeValidAddress(): CreateClientInputDto['address'] {
  return {
    zipCode: '12345-678',
    street: 'Rua das Laranjeiras',
    number: '100',
    complement: null,
    neighborhood: 'Centro',
    city: 'São Paulo',
    cityCodeIbge: '3550308',
    state: 'SP',
  };
}

function makeValidInputDto(overrides: Partial<CreateClientInputDto> = {}): CreateClientInputDto {
  return {
    parentClientId: null,
    type: ClientType.PJ,
    document: '09.748.165/0001-10',
    ie: null,
    groupId: 1,
    resaleId: 1,
    companyId: 1,
    companyName: 'Empresa LTDA',
    fantasyName: null,
    socialName: null,
    domain: null,
    headquarters: 'São Paulo',
    invoiceType: ClientInvoiceType.CONTRACT,
    generateInvoice: true,
    address: makeValidAddress(),
    ...overrides,
  };
}

describe('CreateClientInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('id field (optional)', () => {
    it('should accept undefined id', async() => {
      const data = { ...makeValidInputDto() };
      delete (data as { id?: unknown }).id;

      const result = await target.transform(data, metadata);

      expect(result.id).toBeUndefined();
    });

    it('should accept valid id', async() => {
      const data = makeValidInputDto({ id: 999 });

      const result = await target.transform(data, metadata);

      expect(result.id).toBe(999);
    });

    it.each([0, -1, 1.5])('should throw if id is invalid (%s)', async(value: number) => {
      const data = makeValidInputDto({ id: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'id');
      });
    });
  });

  describe('type field', () => {
    it.each([undefined, null, '', '  '])('should throw if type is empty (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ type: value as ClientType });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'type');
      });
    });

    it('should throw if type is invalid', async() => {
      const data = makeValidInputDto({ type: 'INVALID' as ClientType });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('type inválido.');
      });
    });

    it.each([ClientType.PF, ClientType.PJ])('should accept valid type (%s)', async(type: ClientType) => {
      const data = makeValidInputDto({ type });

      const result = await target.transform(data, metadata);

      expect(result.type).toBe(type);
    });

    it('should trim type', async() => {
      const data = makeValidInputDto({ type: '  PJ  ' as ClientType });

      const result = await target.transform(data, metadata);

      expect(result.type).toBe('PJ');
    });
  });

  describe('document field', () => {
    it.each([undefined, null, '', '  '])('should throw if document is empty (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ document: value as string });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('document é obrigatório');
      });
    });

    it('should trim document', async() => {
      const data = makeValidInputDto({ document: '  09.748.165/0001-10  ' });

      const result = await target.transform(data, metadata);

      expect(result.document).toBe('09.748.165/0001-10');
    });
  });

  describe('ie field (optional)', () => {
    it('should accept null ie', async() => {
      const data = makeValidInputDto({ ie: null });

      const result = await target.transform(data, metadata);

      expect(result.ie).toBeNull();
    });

    it('should accept undefined ie', async() => {
      const data = { ...makeValidInputDto() };
      delete (data as { ie?: unknown }).ie;

      const result = await target.transform(data, metadata);

      expect(result.ie).toBeUndefined();
    });

    it('should trim ie when provided', async() => {
      const data = makeValidInputDto({ ie: '  123456789  ' });

      const result = await target.transform(data, metadata);

      expect(result.ie).toBe('123456789');
    });
  });

  describe('groupId field', () => {
    it.each([undefined, null])('should throw if groupId is empty (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ groupId: value as number });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'groupId');
      });
    });

    it.each([0, -1, 1.5])('should throw if groupId is invalid (%s)', async(value: number) => {
      const data = makeValidInputDto({ groupId: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'groupId');
      });
    });

    it('should accept valid groupId', async() => {
      const data = makeValidInputDto({ groupId: 10 });

      const result = await target.transform(data, metadata);

      expect(result.groupId).toBe(10);
    });
  });

  describe('companyId field', () => {
    it.each([undefined, null])('should throw if companyId is missing (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ companyId: value as number });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'companyId');
      });
    });

    it('should accept valid companyId', async() => {
      const data = makeValidInputDto({ companyId: 3 });

      const result = await target.transform(data, metadata);

      expect(result.companyId).toBe(3);
    });
  });

  describe('resaleId field', () => {
    it.each([undefined, null])('should throw if resaleId is empty (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ resaleId: value as number });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'resaleId');
      });
    });

    it.each([0, -1, 1.5])('should throw if resaleId is invalid (%s)', async(value: number) => {
      const data = makeValidInputDto({ resaleId: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'resaleId');
      });
    });

    it('should accept valid resaleId', async() => {
      const data = makeValidInputDto({ resaleId: 20 });

      const result = await target.transform(data, metadata);

      expect(result.resaleId).toBe(20);
    });
  });

  describe('honorificId field (optional)', () => {
    it('should accept undefined honorificId', async() => {
      const data = makeValidInputDto();
      delete (data as { honorificId?: unknown }).honorificId;

      const result = await target.transform(data, metadata);

      expect(result.honorificId).toBeUndefined();
    });

    it('should accept valid honorificId', async() => {
      const data = makeValidInputDto({ honorificId: 3 });

      const result = await target.transform(data, metadata);

      expect(result.honorificId).toBe(3);
    });

    it('should accept null honorificId', async() => {
      const data = makeValidInputDto({ honorificId: null });

      const result = await target.transform(data, metadata);

      expect(result.honorificId).toBeNull();
    });

    it.each([0, -1, 1.5])('should throw if honorificId is invalid (%s)', async(value: number) => {
      const data = makeValidInputDto({ honorificId: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'honorificId');
      });
    });
  });

  describe('companyName field', () => {
    it.each([undefined, null, '', '  '])('should throw if companyName is empty (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ companyName: value as string });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyName é obrigatório');
      });
    });

    it('should trim companyName', async() => {
      const data = makeValidInputDto({ companyName: '  Empresa LTDA  ' });

      const result = await target.transform(data, metadata);

      expect(result.companyName).toBe('Empresa LTDA');
    });
  });

  describe('fantasyName field (optional)', () => {
    it('should accept null fantasyName', async() => {
      const data = makeValidInputDto({ fantasyName: null });

      const result = await target.transform(data, metadata);

      expect(result.fantasyName).toBeNull();
    });

    it('should trim fantasyName when provided', async() => {
      const data = makeValidInputDto({ fantasyName: '  Empresa  ' });

      const result = await target.transform(data, metadata);

      expect(result.fantasyName).toBe('Empresa');
    });
  });

  describe('socialName field (optional)', () => {
    it('should accept null socialName', async() => {
      const data = makeValidInputDto({ socialName: null });

      const result = await target.transform(data, metadata);

      expect(result.socialName).toBeNull();
    });

    it('should accept undefined socialName', async() => {
      const data = makeValidInputDto();
      delete (data as { socialName?: unknown }).socialName;

      const result = await target.transform(data, metadata);

      expect(result.socialName).toBeUndefined();
    });

    it('should trim socialName when provided', async() => {
      const data = makeValidInputDto({ socialName: '  Nome social  ' });

      const result = await target.transform(data, metadata);

      expect(result.socialName).toBe('Nome social');
    });
  });

  describe('domain field (optional)', () => {
    it('should accept undefined domain', async() => {
      const data = makeValidInputDto();
      delete (data as { domain?: unknown }).domain;

      const result = await target.transform(data, metadata);

      expect(result.domain).toBeUndefined();
    });

    it('should accept null domain', async() => {
      const data = makeValidInputDto({ domain: null });

      const result = await target.transform(data, metadata);

      expect(result.domain).toBeNull();
    });

    it('should trim domain when provided', async() => {
      const data = makeValidInputDto({ domain: '  cliente.dev  ' });

      const result = await target.transform(data, metadata);

      expect(result.domain).toBe('cliente.dev');
    });

    it('should reject domain longer than 128 characters', async() => {
      const data = makeValidInputDto({ domain: `${'x'.repeat(129)}` });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'domain');
      });
    });

    it('should accept domain with exactly 128 characters', async() => {
      const domain = `${'m'.repeat(128)}`;
      const data = makeValidInputDto({ domain });

      const result = await target.transform(data, metadata);

      expect(result.domain).toBe(domain);
    });

    it('should trim then validate max length', async() => {
      const padded = `${'p'.repeat(127)}`;
      const data = makeValidInputDto({ domain: `  ${padded}xx  ` });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'domain');
      });
    });
  });

  describe('headquarters field', () => {
    it.each([undefined, null, '', '  '])('should throw if headquarters is empty (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ headquarters: value as string });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('headquarters é obrigatório');
      });
    });

    it('should trim headquarters', async() => {
      const data = makeValidInputDto({ headquarters: '  São Paulo  ' });

      const result = await target.transform(data, metadata);

      expect(result.headquarters).toBe('São Paulo');
    });
  });

  describe('invoiceType field', () => {
    it('should throw if invoiceType is invalid', async() => {
      const data = makeValidInputDto({ invoiceType: 'INVALID' as ClientInvoiceType });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('invoiceType inválido.');
      });
    });

    it.each([ClientInvoiceType.INDIVIDUAL, ClientInvoiceType.CONTRACT])(
      'should accept valid invoiceType (%s)',
      async(invoiceType: ClientInvoiceType) => {
        const data = makeValidInputDto({ invoiceType });

        const result = await target.transform(data, metadata);

        expect(result.invoiceType).toBe(invoiceType);
      },
    );
  });

  describe('generateInvoice field', () => {
    it('should throw if generateInvoice is not boolean (object)', async() => {
      const data = makeValidInputDto({ generateInvoice: {} as unknown as boolean });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'generateInvoice');
      });
    });

    it('should convert string "true" to boolean', async() => {
      const data = { ...makeValidInputDto(), generateInvoice: 'true' as unknown as boolean };

      const result = await target.transform(data, metadata);

      expect(result.generateInvoice).toBe(true);
    });

    it('should convert string "false" to boolean', async() => {
      const data = { ...makeValidInputDto(), generateInvoice: 'false' as unknown as boolean };

      const result = await target.transform(data, metadata);

      expect(result.generateInvoice).toBe(false);
    });

    it('should accept boolean true', async() => {
      const data = makeValidInputDto({ generateInvoice: true });

      const result = await target.transform(data, metadata);

      expect(result.generateInvoice).toBe(true);
    });

    it('should accept boolean false', async() => {
      const data = makeValidInputDto({ generateInvoice: false });

      const result = await target.transform(data, metadata);

      expect(result.generateInvoice).toBe(false);
    });
  });

  describe('address field', () => {
    it.each([undefined, null])('should throw if address is missing (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ address: value as CreateClientInputDto['address'] });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'address');
      });
    });

    it('should throw if address is not a nested object', async() => {
      const data = makeValidInputDto({ address: 'invalid' as unknown as CreateClientInputDto['address'] });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'address');
      });
    });

    it.each([undefined, null, '', '  '])('should throw if address.zipCode is empty (%s)', async(value: unknown) => {
      const data = makeValidInputDto({
        address: { ...makeValidAddress(), zipCode: value as string },
      });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'zipCode');
      });
    });

    it.each([undefined, null, '', '  '])('should throw if address.street is empty (%s)', async(value: unknown) => {
      const data = makeValidInputDto({
        address: { ...makeValidAddress(), street: value as string },
      });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'street');
      });
    });

    it('should trim address string fields', async() => {
      const data = makeValidInputDto({
        address: {
          zipCode: '  12345-678  ',
          street: '  Rua das Laranjeiras  ',
          number: '  100A  ',
          complement: null,
          neighborhood: '  Centro  ',
          city: '  São Paulo  ',
          cityCodeIbge: '3550308',
          state: '  SP  ',
        },
      });

      const result = await target.transform(data, metadata);

      expect(result.address.zipCode).toBe('12345-678');
      expect(result.address.street).toBe('Rua das Laranjeiras');
      expect(result.address.number).toBe('100A');
      expect(result.address.neighborhood).toBe('Centro');
      expect(result.address.city).toBe('São Paulo');
      expect(result.address.state).toBe('SP');
    });

    it('should accept null complement in address', async() => {
      const data = makeValidInputDto({
        address: { ...makeValidAddress(), complement: null },
      });

      const result = await target.transform(data, metadata);

      expect(result.address.complement).toBeNull();
    });
  });

  describe('createdAt field (optional)', () => {
    it('should accept undefined createdAt', async() => {
      const data = { ...makeValidInputDto() };
      delete (data as { createdAt?: unknown }).createdAt;

      const result = await target.transform(data, metadata);

      expect(result.createdAt).toBeUndefined();
    });

    it('should accept valid yyyy-mm-dd createdAt', async() => {
      const result = await target.transform(
        makeValidInputDto({ createdAt: '2020-03-15' }),
        metadata,
      );

      expect(result.createdAt).toBe('2020-03-15');
    });

    it.each(['03/15/2020', '2020-3-5', '2020-03-15T10:00:00.000Z'])(
      'should throw if createdAt format is invalid (%s)',
      async(value: string) => {
        expect.assertions(1);
        return target.transform(makeValidInputDto({ createdAt: value }), metadata).catch((error) => {
          expectMessageToContain(error.getResponse().message, 'createdAt');
        });
      },
    );

  });

  describe('all fields validation', () => {
    it('should pass if all fields are valid', async() => {
      const data = makeValidInputDto();

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(CreateClientInputDto);
      expect(result.type).toBe(ClientType.PJ);
      expect(result.document).toBe('09.748.165/0001-10');
      expect(result.ie).toBeNull();
      expect(result.groupId).toBe(1);
      expect(result.resaleId).toBe(1);
      expect(result.companyId).toBe(1);
      expect(result.companyName).toBe('Empresa LTDA');
      expect(result.fantasyName).toBeNull();
      expect(result.socialName).toBeNull();
      expect(result.headquarters).toBe('São Paulo');
      expect(result.invoiceType).toBe(ClientInvoiceType.CONTRACT);
      expect(result.generateInvoice).toBe(true);
      expect(result.address).toEqual(makeValidAddress());
    });

    it('should pass with all optional fields filled', async() => {
      const data = makeValidInputDto({
        ie: '123456789',
        fantasyName: 'Empresa',
        socialName: 'Razão social',
        address: {
          ...makeValidAddress(),
          complement: 'Apto 202',
        },
      });

      const result = await target.transform(data, metadata);

      expect(result.ie).toBe('123456789');
      expect(result.fantasyName).toBe('Empresa');
      expect(result.socialName).toBe('Razão social');
      expect(result.address.complement).toBe('Apto 202');
    });
  });
});
