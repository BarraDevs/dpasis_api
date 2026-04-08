import type { ClaimValue } from 'src/app/authentication/domain/authorization/claim';
import { ClaimAction } from 'src/app/authentication/domain/authorization/claim-action.enum';
import { CLAIM_SUBJECT_LABELS, ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import { AdminSubjectPermissionInputDto, AdminSubjectPermissionResponseDto } from '../dtos/admin-subject-permission.dto';
import { PermissionLevel } from './permission-level.enum';

export type ClaimInputRow = { subject: string; action: string };

function pairKey(subject: string, action: string): string {
  return `${subject}:${action}`;
}

/**
 * Converte o payload da UI (checkbox + leitura/escrita) nos pares persistidos em `account_claim`.
 * `write` gera `read` + `write` para o mesmo assunto.
 */
export function subjectPermissionsToClaimInputs(subjects: AdminSubjectPermissionInputDto[]): ClaimInputRow[] {
  const seen = new Set<string>();
  const rows: ClaimInputRow[] = [];

  for (const row of subjects) {
    if (!row.enabled || row.level === undefined) {
      continue;
    }

    const subject = row.subject;

    const push = (action: ClaimAction) => {
      const k = pairKey(subject, action);
      if (seen.has(k)) {
        return;
      }
      seen.add(k);
      rows.push({ subject, action });
    };

    if (row.level === PermissionLevel.Read) {
      push(ClaimAction.Read);
    }
    else {
      push(ClaimAction.Read);
      push(ClaimAction.Write);
    }
  }

  return rows;
}

/**
 * Monta a lista completa de assuntos com enabled/level a partir das claims persistidas.
 */
export function claimValuesToSubjectPermissions(claims: ClaimValue[]): AdminSubjectPermissionResponseDto[] {
  const bySubject = new Map<ClaimSubject, { hasRead: boolean; hasWrite: boolean }>();

  for (const c of claims) {
    const sub = c.subject as ClaimSubject;
    if (!Object.values(ClaimSubject).includes(sub)) {
      continue;
    }
    let slot = bySubject.get(sub);
    if (!slot) {
      slot = { hasRead: false, hasWrite: false };
      bySubject.set(sub, slot);
    }
    if (c.action === ClaimAction.Read) {
      slot.hasRead = true;
    }
    if (c.action === ClaimAction.Write) {
      slot.hasWrite = true;
    }
  }

  const ordered = Object.values(ClaimSubject).sort((a, b) => a.localeCompare(b));

  return ordered.map(subject => {
    const slot = bySubject.get(subject);
    const enabled = Boolean(slot?.hasRead || slot?.hasWrite);
    const level = slot?.hasWrite
      ? PermissionLevel.Write
      : slot?.hasRead
        ? PermissionLevel.Read
        : PermissionLevel.Read;

    return {
      subject,
      label: CLAIM_SUBJECT_LABELS[subject],
      enabled,
      level,
    };
  });
}

export function permissionSubjectCatalog(): Array<{ subject: ClaimSubject; label: string }> {
  return Object.values(ClaimSubject)
    .sort((a, b) => a.localeCompare(b))
    .map(subject => ({
      subject,
      label: CLAIM_SUBJECT_LABELS[subject],
    }));
}
