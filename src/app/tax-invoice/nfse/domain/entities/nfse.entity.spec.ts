import { NfseStatus } from '../enums/nfse-status.enum';
import { NfseAlreadyCanceledError } from '../errors/nfse-already-canceled.error';
import { NfseAlreadyIssuedError } from '../errors/nfse-already-issued.error';
import { NfseNotIssuedError } from '../errors/nfse-not-issued.error';
import { Nfse, NfseProps } from './nfse.entity';

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
    data: {},
    ...overrides,
  };
}

describe('Nfse - Unit tests', () => {
  it('should be defined', () => {
    expect(Nfse._instantiate(makeNfseProps())).toBeDefined();
  });

  it('should move to SUBMITTED and store the batch protocol on markSubmitted', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps());

    // Act
    sut.markSubmitted('protocol-123');

    // Assert
    expect(sut.props.status).toBe(NfseStatus.SUBMITTED);
    expect(sut.props.batchProtocol).toBe('protocol-123');
  });

  it('should move to PROCESSING on markProcessing', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.SUBMITTED, batchProtocol: 'protocol-123' }));

    // Act
    sut.markProcessing();

    // Assert
    expect(sut.props.status).toBe(NfseStatus.PROCESSING);
  });

  it('should move to ISSUED and store nfseNumber/verificationCode/issuedAt on markIssued', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.SUBMITTED, batchProtocol: 'protocol-123' }));
    const issuedAt = new Date('2026-07-20T10:00:00Z');

    // Act
    sut.markIssued('1000', 'ABC123', issuedAt);

    // Assert
    expect(sut.props.status).toBe(NfseStatus.ISSUED);
    expect(sut.props.nfseNumber).toBe('1000');
    expect(sut.props.verificationCode).toBe('ABC123');
    expect(sut.props.issuedAt).toEqual(issuedAt);
  });

  it('should move to FAILED and store the error message on markFailed', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.SUBMITTED }));

    // Act
    sut.markFailed('Lote rejeitado pelo Giss');

    // Assert
    expect(sut.props.status).toBe(NfseStatus.FAILED);
    expect(sut.props.errorMessage).toBe('Lote rejeitado pelo Giss');
  });

  it('should allow markFailed from PENDING status', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.PENDING }));

    // Act
    sut.markFailed('Erro antes do envio');

    // Assert
    expect(sut.props.status).toBe(NfseStatus.FAILED);
    expect(sut.props.errorMessage).toBe('Erro antes do envio');
  });

  it('should allow markIssued directly from PENDING without going through SUBMITTED', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.PENDING }));
    const issuedAt = new Date('2026-07-20T10:00:00Z');

    // Act
    sut.markIssued('1000', 'ABC123', issuedAt);

    // Assert
    expect(sut.props.status).toBe(NfseStatus.ISSUED);
    expect(sut.props.nfseNumber).toBe('1000');
    expect(sut.props.verificationCode).toBe('ABC123');
    expect(sut.props.issuedAt).toEqual(issuedAt);
  });

  it('should follow the full lifecycle PENDING → SUBMITTED → PROCESSING → ISSUED → CANCELED', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps());
    const issuedAt = new Date('2026-07-20T10:00:00Z');
    const canceledAt = new Date('2026-07-29T12:00:00Z');

    // Act
    sut.markSubmitted('protocol-123');
    sut.markProcessing();
    sut.markIssued('1000', 'ABC123', issuedAt);
    sut.markCanceled(canceledAt, 2);

    // Assert
    expect(sut.props).toMatchObject({
      status: NfseStatus.CANCELED,
      batchProtocol: 'protocol-123',
      nfseNumber: '1000',
      verificationCode: 'ABC123',
      issuedAt,
      canceledAt,
      cancelReasonCode: 2,
    });
  });

  it('should throw NfseAlreadyIssuedError when trying to mutate an already issued Nfse', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.ISSUED, nfseNumber: '1000' }));

    // Act & Assert
    expect(() => sut.markSubmitted('other-protocol')).toThrow(NfseAlreadyIssuedError);
    expect(() => sut.markProcessing()).toThrow(NfseAlreadyIssuedError);
    expect(() => sut.markFailed('erro')).toThrow(NfseAlreadyIssuedError);
    expect(() => sut.markIssued('1001', 'XYZ', new Date())).toThrow(NfseAlreadyIssuedError);
  });

  it('should throw NfseAlreadyIssuedError when markProcessing is called on an ISSUED Nfse', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.ISSUED, nfseNumber: '1000' }));

    // Act & Assert
    expect(() => sut.markProcessing()).toThrow(NfseAlreadyIssuedError);
  });

  it('should allow markSubmitted on a FAILED Nfse for retry', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.FAILED, errorMessage: 'timeout' }));

    // Act
    sut.markSubmitted('protocol-retry');

    // Assert
    expect(sut.props.status).toBe(NfseStatus.SUBMITTED);
    expect(sut.props.batchProtocol).toBe('protocol-retry');
  });

  it('should move to CANCELED and store canceledAt/cancelReasonCode on markCanceled', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.ISSUED, nfseNumber: '1000' }));
    const canceledAt = new Date('2026-07-29T12:00:00Z');

    // Act
    sut.markCanceled(canceledAt, 2);

    // Assert
    expect(sut.props.status).toBe(NfseStatus.CANCELED);
    expect(sut.props.canceledAt).toEqual(canceledAt);
    expect(sut.props.cancelReasonCode).toBe(2);
  });

  it.each([1, 4])('should store cancelReasonCode %s on markCanceled', (cancelReasonCode) => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.ISSUED, nfseNumber: '1000' }));
    const canceledAt = new Date('2026-07-29T12:00:00Z');

    // Act
    sut.markCanceled(canceledAt, cancelReasonCode);

    // Assert
    expect(sut.props.cancelReasonCode).toBe(cancelReasonCode);
  });

  it.each([
    NfseStatus.PENDING,
    NfseStatus.SUBMITTED,
    NfseStatus.PROCESSING,
    NfseStatus.FAILED,
  ])('should throw NfseNotIssuedError when trying to cancel a Nfse with status %s', (status) => {
    const sut = Nfse._instantiate(makeNfseProps({ status }));
    expect(() => sut.markCanceled(new Date(), 1)).toThrow(NfseNotIssuedError);
  });

  it('should throw NfseAlreadyCanceledError when trying to cancel an already CANCELED Nfse', () => {
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.CANCELED }));
    expect(() => sut.markCanceled(new Date(), 1)).toThrow(NfseAlreadyCanceledError);
  });

  it('should throw NfseAlreadyCanceledError on ensureCanCancel when status is CANCELED', () => {
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.CANCELED }));
    expect(() => sut.ensureCanCancel()).toThrow(NfseAlreadyCanceledError);
  });

  it('should throw NfseNotIssuedError on ensureCanCancel when status is not ISSUED', () => {
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.PENDING }));
    expect(() => sut.ensureCanCancel()).toThrow(NfseNotIssuedError);
  });

  it('should allow ensureCanCancel when status is ISSUED', () => {
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.ISSUED, nfseNumber: '1000' }));
    expect(() => sut.ensureCanCancel()).not.toThrow();
  });

  it('should report isIssued only for ISSUED status', () => {
    expect(Nfse._instantiate(makeNfseProps({ status: NfseStatus.ISSUED })).isIssued()).toBe(true);
    expect(Nfse._instantiate(makeNfseProps({ status: NfseStatus.PENDING })).isIssued()).toBe(false);
  });

  it('should report isFailed only for FAILED status', () => {
    expect(Nfse._instantiate(makeNfseProps({ status: NfseStatus.FAILED })).isFailed()).toBe(true);
    expect(Nfse._instantiate(makeNfseProps({ status: NfseStatus.SUBMITTED })).isFailed()).toBe(false);
  });

  it('should report isTerminal for ISSUED, FAILED and CANCELED', () => {
    expect(Nfse._instantiate(makeNfseProps({ status: NfseStatus.ISSUED })).isTerminal()).toBe(true);
    expect(Nfse._instantiate(makeNfseProps({ status: NfseStatus.FAILED })).isTerminal()).toBe(true);
    expect(Nfse._instantiate(makeNfseProps({ status: NfseStatus.CANCELED })).isTerminal()).toBe(true);
    expect(Nfse._instantiate(makeNfseProps({ status: NfseStatus.SUBMITTED })).isTerminal()).toBe(false);
  });

  it('should not report AWAITING_PROVIDER as terminal', () => {
    expect(Nfse._instantiate(makeNfseProps({ status: NfseStatus.AWAITING_PROVIDER })).isTerminal()).toBe(false);
  });

  it('should not allow polling a canceled nfse even when a batchProtocol is present', () => {
    expect(Nfse._instantiate(makeNfseProps({
      status: NfseStatus.CANCELED,
      batchProtocol: 'protocol-123',
    })).canPoll()).toBe(false);
  });

  it('should keep an AWAITING_PROVIDER nfse pollable while it has a batchProtocol', () => {
    expect(Nfse._instantiate(makeNfseProps({
      status: NfseStatus.AWAITING_PROVIDER,
      batchProtocol: 'protocol-123',
    })).canPoll()).toBe(true);

    expect(Nfse._instantiate(makeNfseProps({
      status: NfseStatus.AWAITING_PROVIDER,
      batchProtocol: null,
    })).canPoll()).toBe(false);
  });

  describe('markAwaitingProvider', () => {
    it('should set the status and keep the reason in errorMessage', () => {
      // Arrange
      const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.SUBMITTED }));

      // Act
      sut.markAwaitingProvider('Provedor já conhece este RPS.');

      // Assert
      expect(sut.props).toMatchObject({
        status: NfseStatus.AWAITING_PROVIDER,
        errorMessage: 'Provedor já conhece este RPS.',
      });
    });

    it('should refuse to downgrade an already issued nfse', () => {
      // Arrange
      const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.ISSUED }));

      // Act & Assert
      expect(() => sut.markAwaitingProvider('qualquer motivo')).toThrow(NfseAlreadyIssuedError);
    });
  });

  it('should report canPoll only when not terminal and batchProtocol is present', () => {
    expect(Nfse._instantiate(makeNfseProps({
      status: NfseStatus.SUBMITTED,
      batchProtocol: 'protocol-123',
    })).canPoll()).toBe(true);

    expect(Nfse._instantiate(makeNfseProps({
      status: NfseStatus.SUBMITTED,
      batchProtocol: null,
    })).canPoll()).toBe(false);

    expect(Nfse._instantiate(makeNfseProps({
      status: NfseStatus.ISSUED,
      batchProtocol: 'protocol-123',
    })).canPoll()).toBe(false);

    expect(Nfse._instantiate(makeNfseProps({
      status: NfseStatus.FAILED,
      batchProtocol: 'protocol-123',
    })).canPoll()).toBe(false);
  });

  it('should return a copy of props, not a live reference', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps());

    // Act
    const props = sut.props;
    sut.markSubmitted('protocol-123');

    // Assert
    expect(props.status).toBe(NfseStatus.PENDING);
    expect(sut.props.status).toBe(NfseStatus.SUBMITTED);
  });

  it('should throw NfseAlreadyIssuedError with pt-BR message', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.ISSUED, nfseNumber: '1000' }));

    // Act & Assert
    expect(() => sut.markSubmitted('protocol')).toThrow(NfseAlreadyIssuedError);
    expect(() => sut.markSubmitted('protocol')).toThrow('Nfse já foi emitida e não pode ser alterada.');
  });

  it('should throw NfseNotIssuedError with pt-BR message', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.PENDING }));

    // Act & Assert
    expect(() => sut.markCanceled(new Date(), 1)).toThrow(NfseNotIssuedError);
    expect(() => sut.markCanceled(new Date(), 1)).toThrow('Nfse não está emitida e não pode ser cancelada.');
  });

  it('should throw NfseAlreadyCanceledError with pt-BR message', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.CANCELED }));

    // Act & Assert
    expect(() => sut.markCanceled(new Date(), 1)).toThrow(NfseAlreadyCanceledError);
    expect(() => sut.markCanceled(new Date(), 1)).toThrow('Nfse já está cancelada.');
  });

  it('should allow markSubmitted, markProcessing and markFailed on a CANCELED Nfse', () => {
    // Arrange
    const sutSubmitted = Nfse._instantiate(makeNfseProps({ status: NfseStatus.CANCELED }));
    const sutProcessing = Nfse._instantiate(makeNfseProps({ status: NfseStatus.CANCELED }));
    const sutFailed = Nfse._instantiate(makeNfseProps({ status: NfseStatus.CANCELED }));

    // Act
    sutSubmitted.markSubmitted('protocol-from-canceled');
    sutProcessing.markProcessing();
    sutFailed.markFailed('erro após cancelamento');

    // Assert
    expect(sutSubmitted.props.status).toBe(NfseStatus.SUBMITTED);
    expect(sutSubmitted.props.batchProtocol).toBe('protocol-from-canceled');
    expect(sutProcessing.props.status).toBe(NfseStatus.PROCESSING);
    expect(sutFailed.props.status).toBe(NfseStatus.FAILED);
    expect(sutFailed.props.errorMessage).toBe('erro após cancelamento');
  });

  it('should allow markSubmitted from PROCESSING status', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.PROCESSING }));

    // Act
    sut.markSubmitted('protocol-from-processing');

    // Assert
    expect(sut.props.status).toBe(NfseStatus.SUBMITTED);
    expect(sut.props.batchProtocol).toBe('protocol-from-processing');
  });

  it('should link bank payment when status is ISSUED', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({
      status: NfseStatus.ISSUED,
      nfseNumber: '1000',
      verificationCode: 'ABC',
      issuedAt: new Date('2026-07-20T10:00:00Z'),
    }));

    // Act
    sut.linkBankPayment('INTER', 'request-code-123');

    // Assert
    expect(sut.hasBankPayment()).toBe(true);
    expect(sut.props.bankPaymentProvider).toBe('INTER');
    expect(sut.props.bankPaymentRequestCode).toBe('request-code-123');
  });

  it('should throw NfseNotIssuedError when linking bank payment without ISSUED status', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.PENDING }));

    // Act / Assert
    expect(() => sut.linkBankPayment('INTER', 'request-code-123')).toThrow(NfseNotIssuedError);
    expect(sut.hasBankPayment()).toBe(false);
  });

  it('should report hasBankPayment as false when request code is absent', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.ISSUED, nfseNumber: '1' }));

    // Assert
    expect(sut.hasBankPayment()).toBe(false);
  });

  it('should report hasBankPayment as false when request code is empty string', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({
      status: NfseStatus.ISSUED,
      nfseNumber: '1',
      bankPaymentRequestCode: '',
    }));

    // Assert
    expect(sut.hasBankPayment()).toBe(false);
  });

  it('should throw NfseNotIssuedError when linking bank payment on CANCELED status', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.CANCELED }));

    // Act & Assert
    expect(() => sut.linkBankPayment('INTER', 'request-code-123')).toThrow(NfseNotIssuedError);
    expect(sut.hasBankPayment()).toBe(false);
  });
});
