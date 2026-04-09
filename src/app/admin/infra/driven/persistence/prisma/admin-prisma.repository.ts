import { Injectable } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { IAdminRepository } from 'src/app/admin/application/persistence/repository/admin-repository.interface';
import { Admin } from 'src/app/admin/domain/entities/admin.entity';
import { AdminFactory } from 'src/app/admin/domain/factories/admin.factory';
import {
  claimFromSubjectAction,
  generateMapKey,
  type ClaimValue,
} from 'src/app/authentication/domain/authorization/claim';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class AdminRepositoryAdapterPrisma implements IAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: Admin, passwordHash: string): Promise<number> {
    return this.prisma.$transaction(async(tx) => {
      const account = await tx.account.create({
        data: {
          role: AccountRole.ADMIN,
          name: entity.props.name,
          email: entity.props.email,
          password: passwordHash,
          status: entity.props.status,
          profilePicture: entity.props.profilePicture,
          canBeRemoved: entity.props.canBeRemoved,
        },
      });

      await tx.admin.create({
        data: {
          accountId: account.id,
          document: entity.props.document,
        },
      });

      const rows = this.dedupeClaimsForCreate(entity.props.claims, account.id);
      if (rows.length > 0) {
        await tx.accountClaim.createMany({ data: rows });
      }

      return account.id;
    });
  }

  public async edit(entity: Admin): Promise<void> {
    const id = entity.props.accountId;
    const { claims } = entity.props;

    await this.prisma.$transaction(async(tx) => {
      await tx.account.update({
        where: { id },
        data: {
          name: entity.props.name,
          email: entity.props.email,
          profilePicture: entity.props.profilePicture,
          status: entity.props.status,
        },
      });

      await tx.admin.update({
        where: { accountId: id },
        data: { document: entity.props.document },
      });

      // Sempre remove todas as claims antes de persistir a nova lista.
      // Não colocar o delete dentro do `if (rows.length > 0)`: se o payload vier
      // com lista vazia, precisamos apagar as antigas para refletir o estado (sem linhas em account_claim).
      // O CaslAbilityFactory não concede permissões CASL quando não há linhas em account_claim para esse admin.
      await tx.accountClaim.deleteMany({ where: { accountId: id } });

      const rows = this.dedupeClaimsForCreate(claims, id);
      if (rows.length > 0) {
        await tx.accountClaim.createMany({ data: rows });
      }
    });
  }

  public async findById(id: number): Promise<Admin | null> {
    const row = await this.prisma.admin.findUnique({
      where: { accountId: id },
      include: {
        account: {
          include: {
            claims: { select: { subject: true, action: true } },
          },
        },
      },
    });

    if (!row) {
      return null;
    }

    const claims: ClaimValue[] = row.account.claims
      .map(c => claimFromSubjectAction(c.subject, c.action))
      .filter((c): c is ClaimValue => c !== null);

    return AdminFactory.load({
      accountId: row.accountId,
      document: row.document,
      name: row.account.name,
      email: row.account.email,
      profilePicture: row.account.profilePicture,
      status: row.account.status as AccountStatus,
      canBeRemoved: row.account.canBeRemoved,
      claims,
    });
  }

  // dedupe: short for deduplication - remove duplicate data
  private dedupeClaimsForCreate(claims: ClaimValue[], accountId: number): Array<{ accountId: number; subject: string; action: string }> {
    const seen = new Set<string>();
    const rows: Array<{ accountId: number; subject: string; action: string }> = [];

    for (const claim of claims) {
      const k = generateMapKey(claim.subject, claim.action);
      if (seen.has(k)) {
        continue;
      }

      seen.add(k);
      rows.push({ accountId, subject: claim.subject, action: claim.action });
    }
    return rows;
  }
}
