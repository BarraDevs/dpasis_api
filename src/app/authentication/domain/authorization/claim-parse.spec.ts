import { parseClaimString } from './claim';

describe('parseClaimString', () => {
  it('should return subject and action for a valid single-colon claim', () => {
    expect(parseClaimString('bank:list')).toEqual({ subject: 'bank', action: 'list' });
  });

  it('should return null when the string contains no colon', () => {
    expect(parseClaimString('banklist')).toBeNull();
  });

  it('should return null when the string contains more than one colon', () => {
    expect(parseClaimString('client:foo:bar')).toBeNull();
  });

  it('should return null when the subject or action is empty', () => {
    expect(parseClaimString(':list')).toBeNull();
    expect(parseClaimString('bank:')).toBeNull();
  });

  it('should trim whitespace before parsing', () => {
    expect(parseClaimString('  bank:list  ')).toEqual({ subject: 'bank', action: 'list' });
  });
});
