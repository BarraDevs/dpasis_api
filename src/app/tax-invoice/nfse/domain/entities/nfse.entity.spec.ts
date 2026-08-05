import { NfseStatus } from '../enums/nfse-status.enum';
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
    NfseStatus.CANCELED,
  ])('should throw NfseNotIssuedError when trying to cancel a Nfse with status %s', (status) => {
    const sut = Nfse._instantiate(makeNfseProps({ status }));
    expect(() => sut.markCanceled(new Date(), 1)).toThrow(NfseNotIssuedError);
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
});
