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
    ownerId: 1,
    companyIds: [1],
    invoiceType: ClientInvoiceType.CONTRACT,
    generateInvoice: true,
    companyName: 'Empresa LTDA',
    fantasyName: null,
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
    ownerId: 1,
    companyIds: [1],
    invoiceType: ClientInvoiceType.CONTRACT,
    generateInvoice: true,
    companyName: 'Empresa LTDA',
    fantasyName: null,
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
        ownerId: 1,
        companyIds: [1],
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        companyName: 'Empresa LTDA',
        fantasyName: null,
        headquarters: 'São Paulo',
      });

      const client = ClientFactory.create(props);

      expect(client).toBeDefined();
      expect(client.props).toEqual<ClientProps>({
        id: expect.any(Number),
        active: true,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: 1,
        ownerId: 1,
        companyIds: [1],
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        companyName: 'Empresa LTDA',
        fantasyName: null,
        headquarters: 'São Paulo',
      });
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

    describe('validation - ownerId', () => {
      it.each([null, undefined, '', '   '])(
        'should throw AppException when ownerId is empty (%s)',
        (ownerId: unknown) => {
          const props = makeClientCreateProps({ ownerId: ownerId as number });

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

    it('should preserve optional fields ie and fantasyName', () => {
      const props = makeClientProps({
        ie: '987654321',
        fantasyName: 'Fantasia Loaded',
      });

      const client = ClientFactory.load(props);

      expect(client.props.ie).toBe('987654321');
      expect(client.props.fantasyName).toBe('Fantasia Loaded');
    });
  });
});
