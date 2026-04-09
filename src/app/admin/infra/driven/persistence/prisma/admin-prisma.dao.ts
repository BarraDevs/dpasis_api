import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { AdminDto, AdminWithClaimsDto } from 'src/app/admin/application/dtos/admin.dto';
import { IAdminDao } from 'src/app/admin/application/persistence/dao/admin-dao.interface';
import { FindAllAdminQueryDto } from 'src/app/admin/application/usecases/find-all-admin/dtos/find-all-admin.dto';
import { claimFromSubjectAction, type ClaimValue } from 'src/app/authentication/domain/authorization/claim';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const AccountSelect = {
  id: true,
  name: true,
  email: true,
  status: true,
  profilePicture: true,
} satisfies Prisma.AccountSelect;

const AccountWithClaimsSelect = {
  ...AccountSelect,
  claims: {
    select: {
      subject: true,
      action: true,
    },
  },
} satisfies Prisma.AccountSelect;

const AdminInclude = {
  account: {
    select: AccountSelect,
  },
} satisfies Prisma.AdminSelect;

const AdminWithClaimsInclude = {
  account: {
    select: AccountWithClaimsSelect,
  },
} satisfies Prisma.AdminSelect;

type AdminRow = Prisma.AdminGetPayload<{ include: typeof AdminInclude }>;

function mapToDto(row: AdminRow): AdminDto {
  return {
    id: row.accountId,
    name: row.account.name,
    email: row.account.email,
    status: row.account.status as AccountStatus,
    profilePicture: row.account.profilePicture,
    document: row.document,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class AdminDaoAdapterPrisma implements IAdminDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllAdminQueryDto): Promise<[AdminDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.AdminWhereInput[] = [
      { account: { role: AccountRole.ADMIN } },
    ];

    if (queries.search?.trim()) {
      const s = queries.search.trim();
      conditions.push({
        OR: [
          { account: { name: { contains: s, mode: 'insensitive' } } },
          { account: { email: { contains: s, mode: 'insensitive' } } },
          { document: { contains: s, mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({
        account: {
          status: queries.active ? AccountStatus.ACTIVE : AccountStatus.INACTIVE,
        },
      });
    }

    const where: Prisma.AdminWhereInput = { AND: conditions };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.admin.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        include: AdminInclude,
        orderBy: { accountId: 'asc' },
      }),
      this.prisma.admin.count({ where }),
    ]);

    return [rows.map(mapToDto), total];
  }

  public async findById(id: number): Promise<AdminDto | null> {
    const row = await this.prisma.admin.findUnique({
      where: { accountId: id },
      include: AdminInclude,
    });
    if (!row) {
      return null;
    }

    return mapToDto(row);
  }

  public async findByIdWithClaims(id: number): Promise<AdminWithClaimsDto | null> {
    const row = await this.prisma.admin.findUnique({
      where: { accountId: id },
      include: AdminWithClaimsInclude,
    });
    if (!row) {
      return null;
    }

    const claims: ClaimValue[] = row.account.claims
      .map(c => claimFromSubjectAction(c.subject, c.action))
      .filter((c): c is ClaimValue => c !== null);

    return {
      ...mapToDto(row),
      claims,
    };
  }

  public async findByDocument(document: string): Promise<{ id: number } | null> {
    const admin = await this.prisma.admin.findFirst({
      where: {
        document: { equals: document, mode: 'insensitive' },
        account: { role: AccountRole.ADMIN },
      },
      include: AdminInclude,
    });

    return admin ? { id: admin.accountId } : null;
  }

  public async findByEmail(email: string): Promise<{ id: number } | null> {
    const account = await this.prisma.account.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });

    return account ? { id: account.id } : null;
  }
}
