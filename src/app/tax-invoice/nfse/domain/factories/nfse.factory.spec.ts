import { AppException } from 'src/core/filters/app.exception';
import { NumberMustBePositiveAndInt } from 'src/shared/value-objects/positive-int/positive-int.error';
import { Nfse, NfseCreateProps, NfseProps } from '../entities/nfse.entity';
import { NfseStatus } from '../enums/nfse-status.enum';
import { NfseFactory } from './nfse.factory';

function makeNfseCreateProps(overrides: Partial<NfseCreateProps> = {}): NfseCreateProps {
  return {
    companyId: 1,
    clientId: 1,
    rpsNumber: 1,
    rpsSeries: '1',
    data: { some: 'payload' },
    ...overrides,
  };
}

function makeNfseProps(overrides: Partial<NfseProps> = {}): NfseProps {
  return {
    id: 1,
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
    bankPaymentIdempotencyKey: null,
    bankPaymentRequestedAt: null,
    bankPaymentErrorMessage: null,
    bankPaymentFailedAt: null,
    bankPaymentStatus: null,
    bankPaymentConfirmedAt: null,
    reconcileAttemptCount: 0,
    nextReconcileAt: null,
    createdAt: new Date('2026-07-20T12:00:00Z'),
    nfmId: null,
    data: {},
    ...overrides,
  };
}

describe('NfseFactory - Unit tests', () => {
  describe('create', () => {
    it('should create a Nfse with defaults for id, status and nullable fields', () => {
      // Arrange
      const props = makeNfseCreateProps({
        companyId: 10,
        clientId: 20,
        rpsNumber: 30,
        rpsSeries: 'A',
        data: { foo: 'bar' },
      });

      // Act
      const sut = NfseFactory.create(props);

      // Assert
      expect(sut).toBeInstanceOf(Nfse);
      expect(sut.props).toEqual<NfseProps>({
        id: 0,
        companyId: 10,
        clientId: 20,
        rpsNumber: 30,
        rpsSeries: 'A',
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
        bankPaymentIdempotencyKey: null,
        bankPaymentRequestedAt: null,
        bankPaymentErrorMessage: null,
        bankPaymentFailedAt: null,
        bankPaymentStatus: null,
        bankPaymentConfirmedAt: null,
        reconcileAttemptCount: 0,
        nextReconcileAt: null,
        createdAt: expect.any(Date) as unknown as Date,
        nfmId: null,
        data: { foo: 'bar' },
      });
    });

    it('should preserve data payload on create', () => {
      // Arrange
      const data = { nested: { value: 1 }, list: [1, 2] };
      const props = makeNfseCreateProps({ data });

      // Act
      const sut = NfseFactory.create(props);

      // Assert
      expect(sut.props.data).toEqual(data);
    });

    it.each([0, -1, 1.5])('should reject invalid companyId (%s)', (companyId) => {
      // Arrange
      const props = makeNfseCreateProps({ companyId });

      // Act & Assert
      expect(() => NfseFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
      expect(() => NfseFactory.create(props)).toThrow('O campo companyId deve ser um número inteiro positivo');
    });

    it.each([0, -1, 1.5])('should reject invalid clientId (%s)', (clientId) => {
      // Arrange
      const props = makeNfseCreateProps({ clientId });

      // Act & Assert
      expect(() => NfseFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
      expect(() => NfseFactory.create(props)).toThrow('O campo clientId deve ser um número inteiro positivo');
    });

    it.each([0, -1, 1.5])('should reject invalid rpsNumber (%s)', (rpsNumber) => {
      // Arrange
      const props = makeNfseCreateProps({ rpsNumber });

      // Act & Assert
      expect(() => NfseFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
      expect(() => NfseFactory.create(props)).toThrow('O campo rpsNumber deve ser um número inteiro positivo');
    });

    it('should accept boundary value 1 for companyId, clientId and rpsNumber', () => {
      // Arrange
      const props = makeNfseCreateProps({ companyId: 1, clientId: 1, rpsNumber: 1 });

      // Act
      const sut = NfseFactory.create(props);

      // Assert
      expect(sut.props.companyId).toBe(1);
      expect(sut.props.clientId).toBe(1);
      expect(sut.props.rpsNumber).toBe(1);
    });

    it.each(['', '   '])('should reject empty rpsSeries (%s)', (rpsSeries) => {
      // Arrange
      const props = makeNfseCreateProps({ rpsSeries });

      // Act & Assert
      expect(() => NfseFactory.create(props)).toThrow(AppException);
      expect(() => NfseFactory.create(props)).toThrow('O campo rpsSeries não pode ser vazio');
    });
  });

  describe('validateReservation', () => {
    it('should accept valid props without requiring rpsNumber', () => {
      // Arrange
      const props = { companyId: 1, clientId: 2, rpsSeries: 'NFSE', data: {} };

      // Act & Assert
      expect(() => NfseFactory.validateReservation(props)).not.toThrow();
    });

    it.each([0, -1, 1.5])('should reject invalid companyId (%s)', (companyId) => {
      // Arrange
      const props = { companyId, clientId: 1, rpsSeries: 'NFSE', data: {} };

      // Act & Assert
      expect(() => NfseFactory.validateReservation(props)).toThrow(NumberMustBePositiveAndInt);
      expect(() => NfseFactory.validateReservation(props)).toThrow('O campo companyId deve ser um número inteiro positivo');
    });

    it.each([0, -1, 1.5])('should reject invalid clientId (%s)', (clientId) => {
      // Arrange
      const props = { companyId: 1, clientId, rpsSeries: 'NFSE', data: {} };

      // Act & Assert
      expect(() => NfseFactory.validateReservation(props)).toThrow(NumberMustBePositiveAndInt);
      expect(() => NfseFactory.validateReservation(props)).toThrow('O campo clientId deve ser um número inteiro positivo');
    });

    it.each(['', '   '])('should reject empty rpsSeries (%s)', (rpsSeries) => {
      // Arrange
      const props = { companyId: 1, clientId: 1, rpsSeries, data: {} };

      // Act & Assert
      expect(() => NfseFactory.validateReservation(props)).toThrow(AppException);
      expect(() => NfseFactory.validateReservation(props)).toThrow('O campo rpsSeries não pode ser vazio');
    });
  });

  describe('load', () => {
    it('should load a Nfse with the provided props (ISSUED)', () => {
      // Arrange
      const issuedAt = new Date('2026-07-20T10:00:00Z');
      const props = makeNfseProps({
        id: 99,
        companyId: 10,
        clientId: 20,
        rpsNumber: 30,
        rpsSeries: 'B',
        status: NfseStatus.ISSUED,
        batchProtocol: 'protocol-123',
        nfseNumber: '1000',
        verificationCode: 'ABC123',
        issuedAt,
        errorMessage: null,
        canceledAt: null,
        cancelReasonCode: null,
        bankPaymentProvider: null,
        bankPaymentRequestCode: null,
        data: { loaded: true },
      });

      // Act
      const sut = NfseFactory.load(props);

      // Assert
      expect(sut).toBeInstanceOf(Nfse);
      expect(sut.props).toEqual(props);
    });

    it('should load preserving non-null bank payment fields', () => {
      // Arrange
      const props = makeNfseProps({
        status: NfseStatus.ISSUED,
        nfseNumber: '1000',
        verificationCode: 'ABC',
        issuedAt: new Date('2026-07-20T10:00:00Z'),
        bankPaymentProvider: 'INTER',
        bankPaymentRequestCode: 'request-factory-1',
      });

      // Act
      const sut = NfseFactory.load(props);

      // Assert
      expect(sut.props.bankPaymentProvider).toBe('INTER');
      expect(sut.props.bankPaymentRequestCode).toBe('request-factory-1');
    });

    it('should load a PENDING Nfse preserving null fields', () => {
      // Arrange
      const props = makeNfseProps({ status: NfseStatus.PENDING });

      // Act
      const sut = NfseFactory.load(props);

      // Assert
      expect(sut.props).toEqual(props);
      expect(sut.props.batchProtocol).toBeNull();
      expect(sut.props.nfseNumber).toBeNull();
      expect(sut.props.verificationCode).toBeNull();
      expect(sut.props.issuedAt).toBeNull();
      expect(sut.props.errorMessage).toBeNull();
      expect(sut.props.canceledAt).toBeNull();
      expect(sut.props.cancelReasonCode).toBeNull();
    });

    it('should load without validating PositiveInt constraints', () => {
      // Arrange
      const props = makeNfseProps({ companyId: 0, clientId: 0, rpsNumber: 0 });

      // Act
      const sut = NfseFactory.load(props);

      // Assert
      expect(sut.props.companyId).toBe(0);
      expect(sut.props.clientId).toBe(0);
      expect(sut.props.rpsNumber).toBe(0);
    });
  });
});
