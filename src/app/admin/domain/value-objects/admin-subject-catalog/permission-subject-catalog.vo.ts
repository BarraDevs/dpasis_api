import { CLAIM_SUBJECT_LABELS, ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';

export class PermissionSubjectCatalogVo {
  private constructor() {}

  static entries(): Array<{ subject: ClaimSubject; label: string }> {
    return Object.values(ClaimSubject)
      .sort((a, b) => a.localeCompare(b))
      .map(subject => ({
        subject,
        label: CLAIM_SUBJECT_LABELS[subject],
      }));
  }
}
