import { Claim, type ClaimValue } from 'src/app/authentication/domain/authorization/claim';
import { ClaimAction } from 'src/app/authentication/domain/authorization/claim-action.enum';
import { CLAIM_SUBJECT_LABELS, ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import { PermissionLevel } from '../../enums/permission-level.enum';
import { AdminSubjectPermissionsVo } from './admin-subject-permissions.vo';

describe('AdminSubjectPermissionsVo', () => {
  describe('fromInput / toClaims', () => {
    it('should emit only read when level is read', () => {
      const rows = AdminSubjectPermissionsVo.fromInput([
        { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Read },
      ]).toClaims();

      expect(rows).toEqual([
        { subject: ClaimSubject.Bank, action: ClaimAction.Read },
      ]);
    });

    it('should emit read and write when level is write', () => {
      const rows = AdminSubjectPermissionsVo.fromInput([
        { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Write },
      ]).toClaims();

      expect(rows).toEqual([
        { subject: ClaimSubject.Bank, action: ClaimAction.Read },
        { subject: ClaimSubject.Bank, action: ClaimAction.Write },
      ]);
    });

    it('should skip disabled subjects', () => {
      const rows = AdminSubjectPermissionsVo.fromInput([
        { subject: ClaimSubject.Bank, enabled: false },
      ]).toClaims();

      expect(rows).toEqual([]);
    });

    it('should deduplicate pairs', () => {
      const rows = AdminSubjectPermissionsVo.fromInput([
        { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Write },
        { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Write },
      ]).toClaims();

      expect(rows).toHaveLength(2);
      expect(rows.filter(r => r.action === ClaimAction.Read)).toHaveLength(1);
      expect(rows.filter(r => r.action === ClaimAction.Write)).toHaveLength(1);
    });

    it('should return empty claims when input is empty', () => {
      expect(AdminSubjectPermissionsVo.fromInput([]).toClaims()).toEqual([]);
    });

    it('should skip enabled rows without level', () => {
      const rows = AdminSubjectPermissionsVo.fromInput([
        { subject: ClaimSubject.Bank, enabled: true },
      ]).toClaims();

      expect(rows).toEqual([]);
    });

    it('should emit claims in order of first enabled appearance per subject', () => {
      const rows = AdminSubjectPermissionsVo.fromInput([
        { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Read },
        { subject: ClaimSubject.Faq, enabled: true, level: PermissionLevel.Read },
      ]).toClaims();

      expect(rows).toEqual([
        { subject: ClaimSubject.Bank, action: ClaimAction.Read },
        { subject: ClaimSubject.Faq, action: ClaimAction.Read },
      ]);
    });

    it('should merge read then write for the same subject into read and write claims', () => {
      const rows = AdminSubjectPermissionsVo.fromInput([
        { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Read },
        { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Write },
      ]).toClaims();

      expect(rows).toEqual([
        { subject: ClaimSubject.Bank, action: ClaimAction.Read },
        { subject: ClaimSubject.Bank, action: ClaimAction.Write },
      ]);
    });

    it('should keep write when read is added after write for the same subject', () => {
      const rows = AdminSubjectPermissionsVo.fromInput([
        { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Write },
        { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Read },
      ]).toClaims();

      expect(rows).toEqual([
        { subject: ClaimSubject.Bank, action: ClaimAction.Read },
        { subject: ClaimSubject.Bank, action: ClaimAction.Write },
      ]);
    });
  });

  describe('fromInput / toSubjects', () => {
    it('should list all subjects disabled with read level when input is empty', () => {
      const subjects = AdminSubjectPermissionsVo.fromInput([]).toSubjects();

      expect(subjects.length).toBe(Object.values(ClaimSubject).length);
      expect(subjects.every(s => !s.enabled && s.level === PermissionLevel.Read)).toBe(true);
    });

    it('should set label from CLAIM_SUBJECT_LABELS for each row', () => {
      const subjects = AdminSubjectPermissionsVo.fromInput([
        { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Read },
      ]).toSubjects();

      for (const row of subjects) {
        expect(row.label).toBe(CLAIM_SUBJECT_LABELS[row.subject]);
      }
    });
  });

  describe('fromClaimValues / toSubjects', () => {
    it('should map write to enabled write', () => {
      const result = AdminSubjectPermissionsVo.fromClaimValues([Claim.BANK_READ, Claim.BANK_WRITE]).toSubjects();

      const bank = result.find(r => r.subject === ClaimSubject.Bank);
      expect(bank?.enabled).toBe(true);
      expect(bank?.level).toBe(PermissionLevel.Write);
    });

    it('should map read-only to enabled read', () => {
      const result = AdminSubjectPermissionsVo.fromClaimValues([Claim.FAQ_READ]).toSubjects();

      const faq = result.find(r => r.subject === ClaimSubject.Faq);
      expect(faq?.enabled).toBe(true);
      expect(faq?.level).toBe(PermissionLevel.Read);
    });

    it('should mark missing subjects as disabled', () => {
      const result = AdminSubjectPermissionsVo.fromClaimValues([]).toSubjects();

      expect(result.length).toBeGreaterThan(0);
      expect(result.every(r => !r.enabled)).toBe(true);
    });

    it('should map write-only claim to enabled with write level', () => {
      const result = AdminSubjectPermissionsVo.fromClaimValues([Claim.BANK_WRITE]).toSubjects();

      const bank = result.find(r => r.subject === ClaimSubject.Bank);
      expect(bank?.enabled).toBe(true);
      expect(bank?.level).toBe(PermissionLevel.Write);
    });

    it('should set disabled rows to read level for UI default', () => {
      const result = AdminSubjectPermissionsVo.fromClaimValues([]).toSubjects();

      expect(result.every(r => !r.enabled && r.level === PermissionLevel.Read)).toBe(true);
    });

    it('should deduplicate identical claims in the array', () => {
      const result = AdminSubjectPermissionsVo.fromClaimValues([
        Claim.BANK_READ,
        Claim.BANK_READ,
      ]).toSubjects();

      const bank = result.find(r => r.subject === ClaimSubject.Bank);
      expect(bank?.enabled).toBe(true);
      expect(bank?.level).toBe(PermissionLevel.Read);
    });

    it('should ignore claims whose subject is not a ClaimSubject value', () => {
      const invalid = {
        subject: 'unknown-subject' as ClaimSubject,
        action: ClaimAction.Read,
      } as ClaimValue;

      const result = AdminSubjectPermissionsVo.fromClaimValues([invalid]).toSubjects();

      expect(result.every(r => !r.enabled)).toBe(true);
    });
  });

  describe('fromClaimValues / toClaims', () => {
    it('should order subjects alphabetically by subject slug', () => {
      const rows = AdminSubjectPermissionsVo.fromClaimValues([
        Claim.FAQ_READ,
        Claim.BANK_READ,
      ]).toClaims();

      expect(rows.map(r => r.subject)).toEqual([
        ClaimSubject.Bank,
        ClaimSubject.Faq,
      ]);
    });

    it('should emit read and write when slot has write', () => {
      const rows = AdminSubjectPermissionsVo.fromClaimValues([
        Claim.BANK_READ,
        Claim.BANK_WRITE,
      ]).toClaims();

      expect(rows).toEqual([
        { subject: ClaimSubject.Bank, action: ClaimAction.Read },
        { subject: ClaimSubject.Bank, action: ClaimAction.Write },
      ]);
    });
  });
});
