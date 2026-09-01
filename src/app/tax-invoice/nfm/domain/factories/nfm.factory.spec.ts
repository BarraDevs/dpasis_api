import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseFactory } from 'src/app/tax-invoice/nfse/domain/factories/nfse.factory';
import { InvalidMonthError } from 'src/shared/value-objects/month/month.error';
import { NumberMustBePositiveAndInt } from 'src/shared/value-objects/positive-int/positive-int.error';
import { Nfm, NfmCreateProps, NfmProps } from '../entities/nfm.entity';
import { NfmFactory } from './nfm.factory';

function makeCreateProps(overrides: Partial<NfmCreateProps> = {}): NfmCreateProps {
  return {
    clientId: 10,
    clientDocument: '00000000000101',
    companyName: 'Empresa Teste',
    referenceMonth: 8,
    referenceYear: 2026,
    totalValueInCents: 10000,
    cnaeNbsIndopId: 5,
    data: { client: { id: 10 } },
    ...overrides,
  };
}

function makeLoadProps(overrides: Partial<NfmProps> = {}): NfmProps {
  return {
    id: 1,
    ...makeCreateProps(),
    nfse: null,
    ...overrides,
  };
}

describe('NfmFactory - Unit tests', () => {
  describe('create', () => {
    it('should create a Nfm with id 0 and nfse null', () => {
      const sut = NfmFactory.create(makeCreateProps());

      expect(sut).toBeInstanceOf(Nfm);
      expect(sut.props).toMatchObject({
        id: 0,
        clientId: 10,
        clientDocument: '00000000000101',
        companyName: 'Empresa Teste',
        referenceMonth: 8,
        referenceYear: 2026,
        totalValueInCents: 10000,
        cnaeNbsIndopId: 5,
        nfse: null,
      });
      expect(sut.props.data).toEqual({ client: { id: 10 } });
    });

    it('should allow totalValueInCents equal to zero', () => {
      const sut = NfmFactory.create(makeCreateProps({ totalValueInCents: 0 }));
      expect(sut.props.totalValueInCents).toBe(0);
    });

    it.each([0, -1, 1.5])('should reject invalid clientId (%s)', (clientId) => {
      expect(() => NfmFactory.create(makeCreateProps({ clientId }))).toThrow(NumberMustBePositiveAndInt);
    });

    it.each([0, 13, -1, 1.5])('should reject invalid referenceMonth (%s)', (referenceMonth) => {
      expect(() => NfmFactory.create(makeCreateProps({ referenceMonth }))).toThrow(InvalidMonthError);
    });

    it('should reject empty companyName', () => {
      expect(() => NfmFactory.create(makeCreateProps({ companyName: '  ' }))).toThrow();
    });

    it.each(['', '  '])('should reject empty clientDocument (%s)', (clientDocument) => {
      expect(() => NfmFactory.create(makeCreateProps({ clientDocument }))).toThrow(
        'O campo clientDocument não pode ser vazio',
      );
    });
  });

  describe('load', () => {
    it('should rehydrate without revalidating', () => {
      const sut = NfmFactory.load(makeLoadProps({
        id: 42,
        referenceMonth: 99,
        totalValueInCents: -1,
      }));

      expect(sut.props.id).toBe(42);
      expect(sut.props.referenceMonth).toBe(99);
      expect(sut.props.totalValueInCents).toBe(-1);
      expect(sut.props.nfse).toBeNull();
    });

    it('should accept an already hydrated nfse', () => {
      const nfse = NfseFactory.load({
        id: 7,
        companyId: 1,
        clientId: 1,
        rpsNumber: 1,
        rpsSeries: '1',
        status: NfseStatus.PENDING,
        batchProtocol: null,
        nfseNumber: null,
        verificationCode: null,
        issuedAt: null,
        errorMessage: null,
        canceledAt: null,
        cancelReasonCode: null,
        bankPaymentProvider: null,
        bankPaymentRequestCode: null,
        data: {},
      });

      const sut = NfmFactory.load(makeLoadProps({ id: 3, nfse }));

      expect(sut.props.nfse?.props.id).toBe(7);
    });
  });
});
