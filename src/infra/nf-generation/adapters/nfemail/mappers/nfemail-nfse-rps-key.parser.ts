export type NfseRpsIdentification = {
  number: number;
  series: number;
};

export function isNfseRpsKey(nfeKey: string | null | undefined): boolean {
  return Boolean(nfeKey?.trim().toUpperCase().startsWith('RPS'));
}

export function parseNfseRpsIdentificationFromKey(nfeKey: string | null | undefined): NfseRpsIdentification | null {
  const key = nfeKey?.trim();
  if (!isNfseRpsKey(key)) {
    return null;
  }

  const digits = key!.slice(3).replace(/\D/g, '');
  if (digits.length < 6) {
    return null;
  }

  const series = Number(digits.slice(-5));
  const number = Number(digits.slice(0, -5));
  if (!Number.isFinite(number) || !Number.isFinite(series)) {
    return null;
  }

  return { number, series };
}
