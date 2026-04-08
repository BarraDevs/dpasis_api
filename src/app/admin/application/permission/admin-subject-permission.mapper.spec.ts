import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { ClaimAction } from 'src/app/authentication/domain/authorization/claim-action.enum';
import { ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import {
  claimValuesToSubjectPermissions,
  permissionSubjectCatalog,
  subjectPermissionsToClaimInputs,
} from './admin-subject-permission.mapper';
import { PermissionLevel } from './permission-level.enum';

describe('subjectPermissionsToClaimInputs', () => {
  it('should emit only read when level is read', () => {
    const rows = subjectPermissionsToClaimInputs([
      { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Read },
    ]);

    expect(rows).toEqual([
      { subject: ClaimSubject.Bank, action: ClaimAction.Read },
    ]);
  });

  it('should emit read and write when level is write', () => {
    const rows = subjectPermissionsToClaimInputs([
      { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Write },
    ]);

    expect(rows).toEqual([
      { subject: ClaimSubject.Bank, action: ClaimAction.Read },
      { subject: ClaimSubject.Bank, action: ClaimAction.Write },
    ]);
  });

  it('should skip disabled subjects', () => {
    const rows = subjectPermissionsToClaimInputs([
      { subject: ClaimSubject.Bank, enabled: false },
    ]);

    expect(rows).toEqual([]);
  });

  it('should deduplicate pairs', () => {
    const rows = subjectPermissionsToClaimInputs([
      { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Write },
      { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Write },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows.filter(r => r.action === ClaimAction.Read)).toHaveLength(1);
    expect(rows.filter(r => r.action === ClaimAction.Write)).toHaveLength(1);
  });
});

describe('claimValuesToSubjectPermissions', () => {
  it('should map write to enabled write', () => {
    const result = claimValuesToSubjectPermissions([Claim.BANK_READ, Claim.BANK_WRITE]);

    const bank = result.find(r => r.subject === ClaimSubject.Bank);
    expect(bank?.enabled).toBe(true);
    expect(bank?.level).toBe(PermissionLevel.Write);
  });

  it('should map read-only to enabled read', () => {
    const result = claimValuesToSubjectPermissions([Claim.FAQ_READ]);

    const faq = result.find(r => r.subject === ClaimSubject.Faq);
    expect(faq?.enabled).toBe(true);
    expect(faq?.level).toBe(PermissionLevel.Read);
  });

  it('should mark missing subjects as disabled', () => {
    const result = claimValuesToSubjectPermissions([]);

    expect(result.length).toBeGreaterThan(0);
    expect(result.every(r => !r.enabled)).toBe(true);
  });
});

describe('permissionSubjectCatalog', () => {
  it('should return one entry per ClaimSubject with label', () => {
    const catalog = permissionSubjectCatalog();

    expect(catalog.length).toBe(Object.keys(ClaimSubject).length);
    expect(catalog[0]).toHaveProperty('subject');
    expect(catalog[0]).toHaveProperty('label');
  });
});
