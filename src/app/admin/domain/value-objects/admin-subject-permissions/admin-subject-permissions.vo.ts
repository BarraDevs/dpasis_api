import { AdminSubjectPermissionInputDto, AdminSubjectPermissionOutputDto } from 'src/app/admin/application/dtos/admin-subject-permission.dto';
import { generateMapKey, type ClaimValue } from 'src/app/authentication/domain/authorization/claim';
import { ClaimAction } from 'src/app/authentication/domain/authorization/claim-action.enum';
import { CLAIM_SUBJECT_LABELS, ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import { PermissionLevel } from '../../enums/permission-level.enum';

type ClaimInputRow = {
  subject: string;
  action: string;
};

type Slot = {
  readonly hasRead: boolean;
  readonly hasWrite: boolean;
};

/**
 * Representa a matriz de permissões por assunto (read/write) para admins.
 * Encapsula a regra de que escrita implica leitura e a conversão para claims persistidas.
 */
export class AdminSubjectPermissionsVo {
  private readonly _slots: ReadonlyMap<ClaimSubject, Slot>;
  private readonly _subjectOrder: readonly ClaimSubject[] | null;

  private constructor(
    slots: Map<ClaimSubject, Slot>,
    subjectOrder: readonly ClaimSubject[] | null,
  ) {
    this._slots = new Map([...slots.entries()].map(([k, v]) => [k, { hasRead: v.hasRead, hasWrite: v.hasWrite }]));
    this._subjectOrder = subjectOrder;
  }

  static fromInput(input: AdminSubjectPermissionInputDto[]): AdminSubjectPermissionsVo {
    const orderedSubjects: ClaimSubject[] = [];
    const seen = new Set<ClaimSubject>();
    const slots = new Map<ClaimSubject, Slot>();

    for (const row of input) {
      if (!row.enabled || row.level === undefined) {
        continue;
      }
      if (!seen.has(row.subject)) {
        seen.add(row.subject);
        orderedSubjects.push(row.subject);
        slots.set(row.subject, { hasRead: false, hasWrite: false });
      }
      const prev = slots.get(row.subject)!;
      if (row.level === PermissionLevel.Read) {
        slots.set(row.subject, { ...prev, hasRead: true });
      }
      else {
        slots.set(row.subject, { hasRead: true, hasWrite: true });
      }
    }

    return new AdminSubjectPermissionsVo(slots, orderedSubjects);
  }

  static fromClaimValues(claims: ClaimValue[]): AdminSubjectPermissionsVo {
    const slots = new Map<ClaimSubject, { hasRead: boolean; hasWrite: boolean }>();

    for (const c of claims) {
      const sub = c.subject as ClaimSubject;
      if (!Object.values(ClaimSubject).includes(sub)) {
        continue;
      }
      let slot = slots.get(sub);
      if (!slot) {
        slot = { hasRead: false, hasWrite: false };
        slots.set(sub, slot);
      }
      if (c.action === ClaimAction.Read) {
        slot.hasRead = true;
      }
      if (c.action === ClaimAction.Write) {
        slot.hasWrite = true;
      }
    }

    return new AdminSubjectPermissionsVo(slots, null);
  }

  /**
   * Pares persistidos em `account_claim`. Ordem segue a primeira aparição do assunto no input
   * (quando criado via {@link AdminSubjectPermissionsVo.fromInput}); caso contrário, assuntos ordenados alfabeticamente.
   */
  public toClaims(): ClaimInputRow[] {
    const seen = new Set<string>();
    const rows: ClaimInputRow[] = [];

    const subjects = this._subjectOrder ?? [...this._slots.keys()].sort((a, b) => a.localeCompare(b));

    for (const subject of subjects) {
      const slot = this._slots.get(subject);
      if (!slot || (!slot.hasRead && !slot.hasWrite)) {
        continue;
      }

      const push = (action: ClaimAction) => {
        const k = generateMapKey(subject, action);
        if (seen.has(k)) {
          return;
        }
        seen.add(k);
        rows.push({ subject, action });
      };

      if (slot.hasWrite) {
        push(ClaimAction.Read);
        push(ClaimAction.Write);
      }
      else if (slot.hasRead) {
        push(ClaimAction.Read);
      }
    }

    return rows;
  }

  /**
   * Lista completa de assuntos com enabled/level para a UI.
   */
  public toSubjects(): AdminSubjectPermissionOutputDto[] {
    const ordered = Object.values(ClaimSubject).sort((a, b) => a.localeCompare(b));

    return ordered.map(subject => {
      const slot = this._slots.get(subject);
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
}
