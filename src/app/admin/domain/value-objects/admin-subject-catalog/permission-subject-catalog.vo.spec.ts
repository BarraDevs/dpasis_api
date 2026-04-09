import { CLAIM_SUBJECT_LABELS, ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import { PermissionSubjectCatalogVo } from './permission-subject-catalog.vo';

describe('PermissionSubjectCatalogVo', () => {
  it('should return one entry per ClaimSubject', () => {
    const catalog = PermissionSubjectCatalogVo.entries();

    expect(catalog).toHaveLength(Object.values(ClaimSubject).length);
  });

  it('should map each subject to its label from CLAIM_SUBJECT_LABELS', () => {
    const catalog = PermissionSubjectCatalogVo.entries();

    for (const { subject, label } of catalog) {
      expect(label).toBe(CLAIM_SUBJECT_LABELS[subject]);
    }
  });

  it('should expose every ClaimSubject exactly once', () => {
    const catalog = PermissionSubjectCatalogVo.entries();
    const subjects = catalog.map(e => e.subject);

    expect(new Set(subjects).size).toBe(subjects.length);

    for (const s of Object.values(ClaimSubject)) {
      expect(subjects).toContain(s);
    }
  });

  it('should sort entries by subject string (localeCompare)', () => {
    const catalog = PermissionSubjectCatalogVo.entries();

    for (let i = 1; i < catalog.length; i++) {
      const prev = catalog[i - 1]!.subject;
      const curr = catalog[i]!.subject;
      expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0);
    }
  });

  it('should return non-empty string labels', () => {
    const catalog = PermissionSubjectCatalogVo.entries();

    expect(catalog.every(e => typeof e.label === 'string' && e.label.trim().length > 0)).toBe(true);
  });
});
