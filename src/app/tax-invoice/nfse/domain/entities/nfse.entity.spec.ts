import { NfseStatus } from '../enums/nfse-status.enum';
import { NfseAlreadyIssuedError } from '../errors/nfse-already-issued.error';
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

  it('should throw NfseAlreadyIssuedError when trying to mutate an already issued Nfse', () => {
    // Arrange
    const sut = Nfse._instantiate(makeNfseProps({ status: NfseStatus.ISSUED, nfseNumber: '1000' }));

    // Act & Assert
    expect(() => sut.markSubmitted('other-protocol')).toThrow(NfseAlreadyIssuedError);
    expect(() => sut.markProcessing()).toThrow(NfseAlreadyIssuedError);
    expect(() => sut.markFailed('erro')).toThrow(NfseAlreadyIssuedError);
    expect(() => sut.markIssued('1001', 'XYZ', new Date())).toThrow(NfseAlreadyIssuedError);
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
