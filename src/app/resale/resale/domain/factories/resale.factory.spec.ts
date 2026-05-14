import { AppException } from 'src/core/filters/app.exception';
import { InvalidDocumentError } from 'src/shared/value-objects/document/document.error';
import { NumberMustBePositiveAndInt } from 'src/shared/value-objects/positive-int/positive-int.error';
import { ResaleCreateProps, ResaleProps } from '../entities/resale.entity';
import { ResaleType } from '../enums/resale-type.enum';
import { ResaleFactory } from './resale.factory';

function makeResaleCreateProps(overrides?: Partial<ResaleCreateProps>): ResaleCreateProps {
  return {
    type: ResaleType.PJ,
    name: 'Revenda Exemplo',
    identifier: null,
    zipCode: '01310-100',
    street: 'Av Paulista',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    licenseType: 'A1',
    document: '09.748.165/0001-10',
    ie: null,
    phone01: '11999999999',
    phone02: null,
    voucher: null,
    email: null,
    website: null,
    nickname: null,
    socialName: null,
    validityDate: null,
    accessEmail: null,
    accessPassword: null,
    paymentDay: null,
    bonus: null,
    billingStartDay: null,
    receivesSupportEmail: false,
    servedByRoot: false,
    manufacturerResale: false,
    indicatorResale: false,
    recurringResale: false,
    profilePictureUrl: null,
    honorificId: null,
    ...overrides,
  };
}

function makeResaleProps(overrides?: Partial<ResaleProps>): ResaleProps {
  return {
    id: 1,
    active: true,
    ...makeResaleCreateProps(),
    ...overrides,
  };
}

describe('ResaleFactory', () => {
  describe('create', () => {
    it('should create a resale with valid props', () => {
      const props = makeResaleCreateProps();
      const resale = ResaleFactory.create(props);

      expect(resale).toBeDefined();
      expect(resale.props).toEqual<ResaleProps>({
        id: 0,
        active: true,
        type: ResaleType.PJ,
        name: 'Revenda Exemplo',
        identifier: null,
        zipCode: '01310-100',
        street: 'Av Paulista',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        licenseType: 'A1',
        document: '09748165000110',
        ie: null,
        phone01: '11999999999',
        phone02: null,
        voucher: null,
        email: null,
        website: null,
        nickname: null,
        socialName: null,
        validityDate: null,
        accessEmail: null,
        accessPassword: null,
        paymentDay: null,
        bonus: null,
        billingStartDay: null,
        receivesSupportEmail: false,
        servedByRoot: false,
        manufacturerResale: false,
        indicatorResale: false,
        recurringResale: false,
        profilePictureUrl: null,
        honorificId: null,
      });
    });

    it('should create a resale with explicit id when provided', () => {
      const props = makeResaleCreateProps();
      const resale = ResaleFactory.create({ ...props, id: 42_000 });
      expect(resale.props.id).toBe(42_000);
    });

    it('should throw when explicit id is not positive', () => {
      const props = makeResaleCreateProps();
      expect(() => ResaleFactory.create({ ...props, id: 0 })).toThrow();
    });

    it('should throw when document is invalid', () => {
      const props = makeResaleCreateProps({ document: '123' });
      expect(() => ResaleFactory.create(props)).toThrow(InvalidDocumentError);
    });

    describe('validation - type', () => {
      it.each([null, undefined, ''])(
        'should throw AppException when type is empty (%s)',
        (type: unknown) => {
          const props = makeResaleCreateProps({ type: type as ResaleType });

          expect(() => ResaleFactory.create(props)).toThrow(AppException);
          expect(() => ResaleFactory.create(props)).toThrow('O campo type não pode ser vazio');
        },
      );

      it('should throw AppException when type is whitespace-only', () => {
        const props = makeResaleCreateProps({ type: '   ' as ResaleType });

        expect(() => ResaleFactory.create(props)).toThrow(AppException);
        expect(() => ResaleFactory.create(props)).toThrow(
          'O campo type não é válido. Valores válidos: PF, PJ',
        );
      });

      it('should throw AppException when type is invalid', () => {
        const props = makeResaleCreateProps({ type: 'INVALID' as ResaleType });

        expect(() => ResaleFactory.create(props)).toThrow(AppException);
        expect(() => ResaleFactory.create(props)).toThrow('O campo type não é válido');
      });

      it.each([ResaleType.PF, ResaleType.PJ])(
        'should accept valid type (%s)',
        (type: ResaleType) => {
          const resale = ResaleFactory.create(makeResaleCreateProps({ type }));

          expect(resale.props.type).toBe(type);
        },
      );

      it('should create with PF type and CPF document', () => {
        const resale = ResaleFactory.create(
          makeResaleCreateProps({
            type: ResaleType.PF,
            document: '974.563.215-58',
          }),
        );

        expect(resale.props.type).toBe(ResaleType.PF);
        expect(resale.props.document).toBe('97456321558');
      });
    });

    it('should throw when name is empty', () => {
      const props = makeResaleCreateProps({ name: '   ' });
      expect(() => ResaleFactory.create(props)).toThrow(AppException);
      expect(() => ResaleFactory.create(props)).toThrow('O campo name não pode ser vazio');
    });

    it('should throw when id is negative', () => {
      const props = makeResaleCreateProps();
      expect(() => ResaleFactory.create({ ...props, id: -1 })).toThrow(NumberMustBePositiveAndInt);
    });

    it('should treat blank optional strings as null', () => {
      const resale = ResaleFactory.create(
        makeResaleCreateProps({
          identifier: '  ',
          phone02: '\t',
          voucher: '',
          email: '  ',
          website: ' ',
          ie: '   ',
          nickname: ' ',
          socialName: ' ',
        }),
      );

      expect(resale.props.identifier).toBeNull();
      expect(resale.props.phone02).toBeNull();
      expect(resale.props.voucher).toBeNull();
      expect(resale.props.email).toBeNull();
      expect(resale.props.website).toBeNull();
      expect(resale.props.ie).toBeNull();
      expect(resale.props.nickname).toBeNull();
      expect(resale.props.socialName).toBeNull();
    });

    it('should accept a valid CPF document', () => {
      const resale = ResaleFactory.create(
        makeResaleCreateProps({ document: '974.563.215-58' }),
      );

      expect(resale.props.document).toBe('97456321558');
    });

    it('should set boolean flags from primitives', () => {
      const resale = ResaleFactory.create(
        makeResaleCreateProps({
          receivesSupportEmail: true,
          servedByRoot: true,
          manufacturerResale: true,
          indicatorResale: true,
          recurringResale: true,
        }),
      );

      expect(resale.props.receivesSupportEmail).toBe(true);
      expect(resale.props.servedByRoot).toBe(true);
      expect(resale.props.manufacturerResale).toBe(true);
      expect(resale.props.indicatorResale).toBe(true);
      expect(resale.props.recurringResale).toBe(true);
    });

    it('should map extended scalars on create (trim é responsabilidade do DTO)', () => {
      const validity = new Date('2026-03-10T00:00:00.000Z');
      const resale = ResaleFactory.create(
        makeResaleCreateProps({
          nickname: 'Apelido Centro',
          socialName: 'Denominação social',
          validityDate: validity,
          accessEmail: 'acesso@test.com',
          accessPassword: 'senha',
          paymentDay: 5,
          bonus: 99,
          billingStartDay: 28,
        }),
      );

      expect(resale.props.nickname).toBe('Apelido Centro');
      expect(resale.props.socialName).toBe('Denominação social');
      expect(resale.props.validityDate).toEqual(validity);
      expect(resale.props.accessEmail).toBe('acesso@test.com');
      expect(resale.props.accessPassword).toBe('senha');
      expect(resale.props.paymentDay).toBe(5);
      expect(resale.props.bonus).toBe(99);
      expect(resale.props.billingStartDay).toBe(28);
    });

    it('should treat blank accessEmail and accessPassword as null', () => {
      const resale = ResaleFactory.create(
        makeResaleCreateProps({
          accessEmail: '   ',
          accessPassword: '\t',
        }),
      );

      expect(resale.props.accessEmail).toBeNull();
      expect(resale.props.accessPassword).toBeNull();
    });

    describe('validation - honorificId', () => {
      it('should set honorificId to null when omitted', () => {
        const resale = ResaleFactory.create(makeResaleCreateProps());

        expect(resale.props.honorificId).toBeNull();
      });

      it.each([-5, -12.9])('should reject invalid honorificId (%s)', (honorificId: number) => {
        const props = makeResaleCreateProps({ honorificId });

        expect(() => ResaleFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
      });
    });
  });

  describe('edit', () => {
    it('should validate fields and keep id and active from input', () => {
      const resale = ResaleFactory.edit(
        makeResaleProps({
          id: 500,
          active: false,
          name: '  Revenda Editada  ',
          document: '28.695.096/0001-79',
        }),
      );

      expect(resale.props.id).toBe(500);
      expect(resale.props.active).toBe(false);
      expect(resale.props.name).toBe('  Revenda Editada  ');
      expect(resale.props.document).toBe('28695096000179');
    });

    it('should preserve extended fields on edit', () => {
      const validity = new Date('2027-01-01T00:00:00.000Z');
      const resale = ResaleFactory.edit(
        makeResaleProps({
          id: 3,
          nickname: 'Patch',
          validityDate: validity,
          paymentDay: 20,
          billingStartDay: 7,
          indicatorResale: true,
          recurringResale: true,
        }),
      );

      expect(resale.props.nickname).toBe('Patch');
      expect(resale.props.validityDate).toEqual(validity);
      expect(resale.props.paymentDay).toBe(20);
      expect(resale.props.billingStartDay).toBe(7);
      expect(resale.props.indicatorResale).toBe(true);
      expect(resale.props.recurringResale).toBe(true);
    });

    it('should throw when document is invalid', () => {
      const props = makeResaleProps({ document: 'invalid' });
      expect(() => ResaleFactory.edit(props)).toThrow(InvalidDocumentError);
    });

    it('should throw when licenseType is empty', () => {
      const props = makeResaleProps({ licenseType: '' });
      expect(() => ResaleFactory.edit(props)).toThrow(AppException);
      expect(() => ResaleFactory.edit(props)).toThrow('O campo licenseType não pode ser vazio');
    });
  });

  describe('load', () => {
    it('should load a resale with the provided props', () => {
      const props = makeResaleProps({ id: 1, name: 'Loaded' });
      const resale = ResaleFactory.load(props);
      expect(resale.props.id).toBe(1);
      expect(resale.props.name).toBe('Loaded');
    });

    it('should not run value-object validation on document', () => {
      const resale = ResaleFactory.load(
        makeResaleProps({ document: 'raw-from-db-not-validated' }),
      );

      expect(resale.props.document).toBe('raw-from-db-not-validated');
    });

    it('should coerce undefined optional string fields to null', () => {
      const base = makeResaleProps();
      const resale = ResaleFactory.load({
        ...base,
        identifier: undefined as unknown as string | null,
        phone02: undefined as unknown as string | null,
        ie: undefined as unknown as string | null,
        socialName: undefined as unknown as string | null,
      });

      expect(resale.props.identifier).toBeNull();
      expect(resale.props.phone02).toBeNull();
      expect(resale.props.ie).toBeNull();
      expect(resale.props.socialName).toBeNull();
    });

    it('should preserve inactive state', () => {
      const resale = ResaleFactory.load(makeResaleProps({ active: false }));

      expect(resale.props.active).toBe(false);
      expect(resale.isActive()).toBe(false);
    });
  });
});
