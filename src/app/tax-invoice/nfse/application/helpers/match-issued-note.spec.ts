import { NfsIssuedNoteDto } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { matchIssuedNote } from './match-issued-note';

function makeNote(overrides: Partial<NfsIssuedNoteDto> = {}): NfsIssuedNoteDto {
  return {
    rpsNumber: 41,
    rpsSeries: 'NFSE',
    nfseNumber: '12345',
    verificationCode: 'ABC',
    issueDate: '2026-09-03T10:00:00',
    ...overrides,
  };
}

describe('matchIssuedNote - Unit tests', () => {
  it('should match on number and series', () => {
    // Arrange
    const notes = [makeNote({ rpsNumber: 40 }), makeNote({ rpsNumber: 41 })];

    // Act
    const result = matchIssuedNote(notes, { rpsNumber: 41, rpsSeries: 'NFSE' });

    // Assert
    expect(result?.rpsNumber).toBe(41);
  });

  it('should normalise the series case and surrounding spaces', () => {
    // Arrange
    const notes = [makeNote({ rpsSeries: ' nfse ' })];

    // Act
    const result = matchIssuedNote(notes, { rpsNumber: 41, rpsSeries: 'NFSE' });

    // Assert
    expect(result).toBe(notes[0]);
  });

  it('should not match a different series', () => {
    // Arrange
    const notes = [makeNote({ rpsSeries: 'A' })];

    // Act
    const result = matchIssuedNote(notes, { rpsNumber: 41, rpsSeries: 'B' });

    // Assert
    expect(result).toBeNull();
  });

  it('should not match a different number', () => {
    // Arrange
    const notes = [makeNote({ rpsNumber: 40 })];

    // Act
    const result = matchIssuedNote(notes, { rpsNumber: 41, rpsSeries: 'NFSE' });

    // Assert
    expect(result).toBeNull();
  });

  it('should accept a single note that carries no RPS identification', () => {
    // Arrange — a identificação é opcional no XSD; com uma nota só a correspondência é inequívoca.
    const notes = [makeNote({ rpsNumber: 0, rpsSeries: '' })];

    // Act
    const result = matchIssuedNote(notes, { rpsNumber: 41, rpsSeries: 'NFSE' });

    // Assert
    expect(result).toBe(notes[0]);
  });

  it('should refuse to guess when several notes carry no RPS identification', () => {
    // Arrange — gravar o número da nota errada é irreversível e silencioso.
    const notes = [makeNote({ rpsNumber: 0, rpsSeries: '' }), makeNote({ rpsNumber: 0, rpsSeries: '' })];

    // Act
    const result = matchIssuedNote(notes, { rpsNumber: 41, rpsSeries: 'NFSE' });

    // Assert
    expect(result).toBeNull();
  });

  it('should return null for an empty list', () => {
    // Act
    const result = matchIssuedNote([], { rpsNumber: 41, rpsSeries: 'NFSE' });

    // Assert
    expect(result).toBeNull();
  });
});
