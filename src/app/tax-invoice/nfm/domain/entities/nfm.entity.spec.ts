import { Nfse } from 'src/app/tax-invoice/nfse/domain/entities/nfse.entity';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseAlreadyCanceledError } from 'src/app/tax-invoice/nfse/domain/errors/nfse-already-canceled.error';
import { NfseNotIssuedError } from 'src/app/tax-invoice/nfse/domain/errors/nfse-not-issued.error';
import { NfseFactory } from 'src/app/tax-invoice/nfse/domain/factories/nfse.factory';
import { NfmNfseMissingError } from '../errors/nfm-nfse-missing.error';
import { Nfm, NfmProps } from './nfm.entity';

function makeIssuedNfse(overrides: Partial<Parameters<typeof NfseFactory.load>[0]> = {}): Nfse {
  return NfseFactory.load({
    id: 99,
    companyId: 1,
    clientId: 1,
    rpsNumber: 1,
    rpsSeries: '1',
    status: NfseStatus.ISSUED,
    batchProtocol: null,
    nfseNumber: '1000',
    verificationCode: 'ABC',
    issuedAt: new Date('2026-07-20T10:00:00Z'),
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
  });
}

function makeNfmProps(overrides: Partial<NfmProps> = {}): NfmProps {
  return {
    id: 1,
    clientId: 10,
    clientDocument: '00000000000101',
    companyName: 'Empresa Teste',
    referenceMonth: 8,
    referenceYear: 2026,
    totalValueInCents: 10000,
    cnaeNbsIndopId: 5,
    data: { snapshot: true },
    nfse: null,
    ...overrides,
  };
}

describe('Nfm - Unit tests', () => {
  it('should be defined', () => {
    expect(Nfm._instantiate(makeNfmProps())).toBeDefined();
  });

  it('should report hasNfse as false when nfse is null', () => {
    const sut = Nfm._instantiate(makeNfmProps({ nfse: null }));
    expect(sut.hasNfse()).toBe(false);
  });

  it('should report hasNfse as true when nfse is present', () => {
    const sut = Nfm._instantiate(makeNfmProps({ nfse: makeIssuedNfse() }));
    expect(sut.hasNfse()).toBe(true);
  });

  it('should throw NfmNfseMissingError on ensureHasNfse when nfse is absent', () => {
    const sut = Nfm._instantiate(makeNfmProps({ id: 42, nfse: null }));
    expect(() => sut.ensureHasNfse()).toThrow(NfmNfseMissingError);
    expect(() => sut.ensureHasNfse()).toThrow('NFM 42 sem NFS-e vinculada.');
  });

  it('should allow ensureHasNfse when nfse is present', () => {
    const sut = Nfm._instantiate(makeNfmProps({ nfse: makeIssuedNfse() }));
    expect(() => sut.ensureHasNfse()).not.toThrow();
  });

  it('should throw NfmNfseMissingError on ensureCanCancel when nfse is absent', () => {
    const sut = Nfm._instantiate(makeNfmProps({ nfse: null }));
    expect(() => sut.ensureCanCancel()).toThrow(NfmNfseMissingError);
  });

  it('should delegate ensureCanCancel to nfse and reject non-issued status', () => {
    const sut = Nfm._instantiate(makeNfmProps({
      nfse: makeIssuedNfse({ status: NfseStatus.PENDING, nfseNumber: null, issuedAt: null }),
    }));
    expect(() => sut.ensureCanCancel()).toThrow(NfseNotIssuedError);
  });

  it('should allow ensureCanCancel when linked nfse is ISSUED', () => {
    const sut = Nfm._instantiate(makeNfmProps({ nfse: makeIssuedNfse() }));
    expect(() => sut.ensureCanCancel()).not.toThrow();
  });

  it('should throw NfseAlreadyCanceledError on ensureCanCancel when linked nfse is CANCELED', () => {
    const sut = Nfm._instantiate(makeNfmProps({
      nfse: makeIssuedNfse({
        status: NfseStatus.CANCELED,
        canceledAt: new Date('2026-07-29T12:00:00Z'),
        cancelReasonCode: 2,
      }),
    }));
    expect(() => sut.ensureCanCancel()).toThrow(NfseAlreadyCanceledError);
  });

  it('should link nfse via linkNfse', () => {
    const sut = Nfm._instantiate(makeNfmProps({ nfse: null }));
    const nfse = makeIssuedNfse({ id: 55 });

    sut.linkNfse(nfse);

    expect(sut.hasNfse()).toBe(true);
    expect(sut.props.nfse?.props.id).toBe(55);
  });

  it('should return a shallow copy of props, not a live reference', () => {
    const sut = Nfm._instantiate(makeNfmProps({ nfse: null }));
    const props = sut.props;

    sut.linkNfse(makeIssuedNfse());

    expect(props.nfse).toBeNull();
    expect(sut.props.nfse).not.toBeNull();
  });
});
