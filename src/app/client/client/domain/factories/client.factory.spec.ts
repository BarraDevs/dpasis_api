import { AppException } from 'src/core/filters/app.exception';
import { InvalidDocumentError } from 'src/shared/value-objects/document/document.error';
import { NumberMustBePositiveAndInt } from 'src/shared/value-objects/positive-int/positive-int.error';
import { ClientCreateProps, ClientProps } from '../entities/client.entity';
import { ClientInvoiceType } from '../enums/client-invoice-type.enum';
import { ClientType } from '../enums/client-type.enum';
import { ClientFactory } from './client.factory';

function makeClientCreateProps(overrides?: Partial<ClientCreateProps>): ClientCreateProps {
  return {
    type: ClientType.PJ,
    document: '09.748.165/0001-10',
    ie: null,
    groupId: 1,
    resaleId: 1,
    companyIds: [1],
    parentClientId: null,
    honorificId: null,
    invoiceType: ClientInvoiceType.CONTRACT,
    generateInvoice: true,
    companyName: 'Empresa LTDA',
    fantasyName: null,
    socialName: null,
    domain: null,
    headquarters: 'São Paulo',
    ...overrides,
  };
}

function makeClientProps(overrides?: Partial<ClientProps>): ClientProps {
  return {
    id: 1,
    active: true,
    type: ClientType.PJ,
    document: '09.748.165/0001-10',
    ie: null,
    groupId: 1,
    resaleId: 1,
    parentClientId: null,
    isSubClient: false,
    honorificId: null,
    companyIds: [1],
    invoiceType: ClientInvoiceType.CONTRACT,
    generateInvoice: true,
    companyName: 'Empresa LTDA',
    fantasyName: null,
    socialName: null,
    domain: null,
    headquarters: 'São Paulo',
    ...overrides,
  };
}

describe('ClientFactory', () => {
  describe('create', () => {
    it('should create a client with valid props', () => {
      const props = makeClientCreateProps({
        document: '09.748.165/0001-10',
        ie: null,
        groupId: 1,
        resaleId: 1,
        companyIds: [1],
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        companyName: 'Empresa LTDA',
        fantasyName: null,
        domain: null,
        headquarters: 'São Paulo',
      });

      const client = ClientFactory.create(props);

      expect(client).toBeDefined();
      expect(client.props).toEqual<ClientProps>({
        id: 0,
        active: true,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: 1,
        resaleId: 1,
        parentClientId: null,
        isSubClient: false,
        honorificId: null,
        companyIds: [1],
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        companyName: 'Empresa LTDA',
        fantasyName: null,
        socialName: null,
        domain: null,
        headquarters: 'São Paulo',
      });
    });

    it('should create a client with explicit id when provided', () => {
      const props = makeClientCreateProps();

      const client = ClientFactory.create({ ...props, id: 42_000 });

      expect(client.props.id).toBe(42_000);
    });

    it('should throw when explicit id is not positive', () => {
      const props = makeClientCreateProps();

      expect(() => ClientFactory.create({ ...props, id: 0 })).toThrow(NumberMustBePositiveAndInt);
    });

    it('should create a client with valid CPF document', () => {
      const props = makeClientCreateProps({
        type: ClientType.PF,
        document: '974.563.215-58',
      });

      const client = ClientFactory.create(props);

      expect(client.props.document).toBe('97456321558');
      expect(client.props.type).toBe(ClientType.PF);
    });

    it('should create a client with optional ie and fantasyName filled', () => {
      const props = makeClientCreateProps({
        ie: '123456789',
        fantasyName: 'Fantasia',
      });

      const client = ClientFactory.create(props);

      expect(client.props.ie).toBe('123456789');
      expect(client.props.fantasyName).toBe('Fantasia');
    });

    describe('validation - type', () => {
      it.each([null, undefined, ''])(
        'should throw AppException when type is empty (%s)',
        (type: unknown) => {
          const props = makeClientCreateProps({ type: type as ClientType });

          expect(() => ClientFactory.create(props)).toThrow(AppException);
          expect(() => ClientFactory.create(props)).toThrow('O campo type não pode ser vazio');
        },
      );

      it('should throw AppException when type is whitespace-only', () => {
        const props = makeClientCreateProps({ type: '   ' as ClientType });

        expect(() => ClientFactory.create(props)).toThrow(AppException);
        expect(() => ClientFactory.create(props)).toThrow('O campo type não é válido. Valores válidos: PF, PJ');
      });

      it('should throw AppException when type is invalid', () => {
        const props = makeClientCreateProps({ type: 'INVALID' as ClientType });

        expect(() => ClientFactory.create(props)).toThrow(AppException);
        expect(() => ClientFactory.create(props)).toThrow('O campo type não é válido');
      });

      it.each([ClientType.PF, ClientType.PJ])('should accept valid type (%s)', (type: ClientType) => {
        const props = makeClientCreateProps({ type });

        const client = ClientFactory.create(props);

        expect(client.props.type).toBe(type);
      });
    });

    describe('validation - document', () => {
      it.each([null, undefined, '', '   '])(
        'should throw AppException when document is empty (%s)',
        (document: unknown) => {
          const props = makeClientCreateProps({ document: document as string });

          expect(() => ClientFactory.create(props)).toThrow(AppException);
          expect(() => ClientFactory.create(props)).toThrow('CPF/CNPJ inválido');
        },
      );

      it('should throw InvalidDocumentError when document has invalid CPF/CNPJ format', () => {
        const props = makeClientCreateProps({ document: '123' });

        expect(() => ClientFactory.create(props)).toThrow(InvalidDocumentError);
        expect(() => ClientFactory.create(props)).toThrow('CPF/CNPJ inválido');
      });
    });

    describe('validation - ie (optional)', () => {
      it('should accept null ie', () => {
        const props = makeClientCreateProps({ ie: null });

        const client = ClientFactory.create(props);

        expect(client.props.ie).toBeNull();
      });

      it('should treat empty string ie as null (optional)', () => {
        const props = makeClientCreateProps({ ie: '' });

        const client = ClientFactory.create(props);

        expect(client.props.ie).toBeNull();
      });

      it('should convert whitespace-only ie to null', () => {
        const props = makeClientCreateProps({ ie: '   ' });

        const client = ClientFactory.create(props);

        expect(client.props.ie).toBeNull();
      });

      it('should accept valid ie when provided', () => {
        const props = makeClientCreateProps({ ie: '123456789' });

        const client = ClientFactory.create(props);

        expect(client.props.ie).toBe('123456789');
      });
    });

    describe('validation - invoiceType', () => {
      it('should throw AppException when invoiceType is invalid', () => {
        const props = makeClientCreateProps({ invoiceType: 'INVALID' as ClientInvoiceType });

        expect(() => ClientFactory.create(props)).toThrow(AppException);
        expect(() => ClientFactory.create(props)).toThrow('O campo invoiceType não é válido');
      });

      it.each([ClientInvoiceType.INDIVIDUAL, ClientInvoiceType.CONTRACT])(
        'should accept valid invoiceType (%s)',
        (invoiceType: ClientInvoiceType) => {
          const props = makeClientCreateProps({ invoiceType });

          const client = ClientFactory.create(props);

          expect(client.props.invoiceType).toBe(invoiceType);
        },
      );
    });

    describe('validation - groupId', () => {
      it.each([null, undefined, '', '   '])(
        'should throw AppException when groupId is empty (%s)',
        (groupId: unknown) => {
          const props = makeClientCreateProps({ groupId: groupId as number });

          expect(() => ClientFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
        },
      );
    });

    describe('validation - resaleId', () => {
      it.each([null, undefined, '', '   '])(
        'should throw AppException when resaleId is empty (%s)',
        (resaleId: unknown) => {
          const props = makeClientCreateProps({ resaleId: resaleId as number });

          expect(() => ClientFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
        },
      );
    });

    describe('validation - companyName', () => {
      it.each([null, undefined, '', '   '])(
        'should throw AppException when companyName is empty (%s)',
        (companyName: unknown) => {
          const props = makeClientCreateProps({ companyName: companyName as string });

          expect(() => ClientFactory.create(props)).toThrow(AppException);
          expect(() => ClientFactory.create(props)).toThrow('O campo companyName não pode ser vazio');
        },
      );
    });

    describe('validation - fantasyName (optional)', () => {
      it('should accept null fantasyName', () => {
        const props = makeClientCreateProps({ fantasyName: null });

        const client = ClientFactory.create(props);

        expect(client.props.fantasyName).toBeNull();
      });

      it('should treat empty string fantasyName as null (optional)', () => {
        const props = makeClientCreateProps({ fantasyName: '' });

        const client = ClientFactory.create(props);

        expect(client.props.fantasyName).toBeNull();
      });

      it('should convert whitespace-only fantasyName to null', () => {
        const props = makeClientCreateProps({ fantasyName: '   ' });

        const client = ClientFactory.create(props);

        expect(client.props.fantasyName).toBeNull();
      });

      it('should accept valid fantasyName when provided', () => {
        const props = makeClientCreateProps({ fantasyName: 'Nome Fantasia' });

        const client = ClientFactory.create(props);

        expect(client.props.fantasyName).toBe('Nome Fantasia');
      });
    });

    describe('validation - socialName (optional)', () => {
      it('should accept null socialName', () => {
        const props = makeClientCreateProps({ socialName: null });

        const client = ClientFactory.create(props);

        expect(client.props.socialName).toBeNull();
      });

      it('should treat empty string socialName as null (optional)', () => {
        const props = makeClientCreateProps({ socialName: '' });

        const client = ClientFactory.create(props);

        expect(client.props.socialName).toBeNull();
      });

      it('should convert whitespace-only socialName to null', () => {
        const props = makeClientCreateProps({ socialName: '   ' });

        const client = ClientFactory.create(props);

        expect(client.props.socialName).toBeNull();
      });

      it('should accept valid socialName when provided', () => {
        const props = makeClientCreateProps({ socialName: 'Razão Social Registrada' });

        const client = ClientFactory.create(props);

        expect(client.props.socialName).toBe('Razão Social Registrada');
      });
    });

    describe('validation - domain (optional)', () => {
      it('should accept null domain', () => {
        const props = makeClientCreateProps({ domain: null });

        const client = ClientFactory.create(props);

        expect(client.props.domain).toBeNull();
      });

      it('should treat empty string domain as null', () => {
        const props = makeClientCreateProps({ domain: '' });

        const client = ClientFactory.create(props);

        expect(client.props.domain).toBeNull();
      });

      it('should convert whitespace-only domain to null', () => {
        const props = makeClientCreateProps({ domain: '   ' });

        const client = ClientFactory.create(props);

        expect(client.props.domain).toBeNull();
      });

      it('should accept domain with up to 128 characters', () => {
        const domain = `${'a'.repeat(127)}b`;
        const props = makeClientCreateProps({ domain });

        const client = ClientFactory.create(props);

        expect(client.props.domain).toBe(domain);
        expect(client.props.domain!.length).toBe(128);
      });

      it('should throw AppException when domain exceeds 128 characters', () => {
        const props = makeClientCreateProps({ domain: 'z'.repeat(129) });

        expect(() => ClientFactory.create(props)).toThrow(AppException);
        expect(() => ClientFactory.create(props)).toThrow('O campo domain deve ter no máximo 128 caracteres');
      });
    });

    describe('validation - companyIds', () => {
      it('should throw when companyIds contains invalid id (0)', () => {
        const props = makeClientCreateProps({ companyIds: [0] });

        expect(() => ClientFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
      });

      it('should throw when companyIds contains invalid id (-1)', () => {
        const props = makeClientCreateProps({ companyIds: [-1] });

        expect(() => ClientFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
      });

      it('should accept valid companyIds', () => {
        const props = makeClientCreateProps({ companyIds: [1, 2, 3] });

        const client = ClientFactory.create(props);

        expect(client.props.companyIds).toEqual([1, 2, 3]);
      });
    });

    describe('validation - headquarters', () => {
      it.each([null, undefined, '', '   '])(
        'should throw AppException when headquarters is empty (%s)',
        (headquarters: unknown) => {
          const props = makeClientCreateProps({ headquarters: headquarters as string });

          expect(() => ClientFactory.create(props)).toThrow(AppException);
          expect(() => ClientFactory.create(props)).toThrow('O campo headquarters não pode ser vazio');
        },
      );
    });

    describe('validation - honorificId', () => {
      it('should set honorificId to null when omitted', () => {
        const client = ClientFactory.create(makeClientCreateProps());

        expect(client.props.honorificId).toBeNull();
      });

      it.each([-5])('should reject invalid honorificId (%s)', (honorificId: number | null | undefined) => {
        const props = makeClientCreateProps({ honorificId });

        expect(() => ClientFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
      });
    });
  });

  describe('edit', () => {
    it('should throw AppException when domain exceeds 128 characters', () => {
      const props = makeClientProps();

      expect(() =>
        ClientFactory.edit({ ...props, domain: 'y'.repeat(129) }),
      ).toThrow(AppException);
    });
  });

  describe('load', () => {
    it('should load a client with the provided props', () => {
      const props = makeClientProps({
        id: 1,
        active: false,
        companyName: 'Loaded Company',
      });

      const client = ClientFactory.load(props);

      expect(client.props.id).toBe(1);
      expect(client.props.active).toBe(false);
      expect(client.props.companyName).toBe('Loaded Company');
    });

    it('should preserve document format from props', () => {
      const props = makeClientProps({ document: '97456321558' });

      const client = ClientFactory.load(props);

      expect(client.props.document).toBe('97456321558');
    });

    it('should preserve optional fields ie, fantasyName and socialName', () => {
      const props = makeClientProps({
        ie: '987654321',
        fantasyName: 'Fantasia Loaded',
        socialName: 'Nome social carregado',
      });

      const client = ClientFactory.load(props);

      expect(client.props.ie).toBe('987654321');
      expect(client.props.fantasyName).toBe('Fantasia Loaded');
      expect(client.props.socialName).toBe('Nome social carregado');
    });

    it('should preserve domain when provided', () => {
      const props = makeClientProps({ domain: 'cliente.persistido.dev' });

      const client = ClientFactory.load(props);

      expect(client.props.domain).toBe('cliente.persistido.dev');
    });

    it('should preserve null domain on load', () => {
      const client = ClientFactory.load(makeClientProps({ domain: null }));

      expect(client.props.domain).toBeNull();
    });
  });
});
