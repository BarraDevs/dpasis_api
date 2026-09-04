import { NfsIssuedNoteDto } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';

export type RpsKey = {
  rpsNumber: number;
  rpsSeries: string;
};

const normalizeSeries = (series: string): string => series.trim().toUpperCase();

/**
 * Casa a nota devolvida pelo provedor com a NFS-e local pela chave natural do RPS. Pegar
 * `issuedNotes[0]` só funcionava porque o lote sempre teve um RPS — com mais de um, grava o número
 * errado, em silêncio e sem volta. Na consulta por período a questão é ainda mais séria: o provedor
 * devolve todas as notas do prestador, inclusive as emitidas fora deste sistema.
 *
 * A tolerância do fallback existe porque a identificação do RPS é opcional no XSD e o parser
 * devolve `0`/`''` quando ela não vem: num conjunto de uma nota só, a correspondência é inequívoca
 * mesmo sem o identificador. Com mais de uma, não é, e aí ninguém é escolhido.
 */
export function matchIssuedNote(issuedNotes: NfsIssuedNoteDto[], key: RpsKey): NfsIssuedNoteDto | null {
  const expectedSeries = normalizeSeries(key.rpsSeries);

  const matched = issuedNotes.find((note) => (
    Number(note.rpsNumber) === key.rpsNumber
    && normalizeSeries(note.rpsSeries) === expectedSeries
  ));
  if (matched) {
    return matched;
  }

  const [onlyNote] = issuedNotes;
  const hasNoRpsIdentification = issuedNotes.length === 1 && !onlyNote.rpsNumber && !onlyNote.rpsSeries.trim();
  return hasNoRpsIdentification ? onlyNote : null;
}
