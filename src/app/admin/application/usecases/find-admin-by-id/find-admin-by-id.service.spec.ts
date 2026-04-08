import { Test } from '@nestjs/testing';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { claimValuesToSubjectPermissions } from 'src/app/admin/application/permission/admin-subject-permission.mapper';
import { PermissionLevel } from 'src/app/admin/application/permission/permission-level.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AdminModule } from '../../../admin.module';
import { AdminNotFoundError } from '../../../domain/errors/admin-not-found.error';
import { AdminDetailDto } from '../../dtos/admin.dto';
import { CreateAdmin } from '../create-admin/create-admin.service';
import { CreateAdminInputDto } from '../create-admin/dtos/create-admin.dto';
import { FindAdminById } from './find-admin-by-id.service';

describe('FindAdminById - Integration tests', () => {
  let sut: FindAdminById;
  let createAdmin: CreateAdmin;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [AdminModule],
    }).compile();

    sut = module.get(FindAdminById);
    createAdmin = module.get(CreateAdmin);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  function makeCreateInput(overrides: Partial<CreateAdminInputDto> = {}): CreateAdminInputDto {
    return {
      name: 'Maria Admin',
      email: 'maria@test.com',
      password: 'SenhaForte123',
      document: '529.982.247-25',
      profilePicture: null,
      subjects: [
        { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Read },
        { subject: ClaimSubject.Faq, enabled: true, level: PermissionLevel.Read },
      ],
      ...overrides,
    };
  }

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw AdminNotFoundError when admin does not exist', async() => {
    await expect(sut.execute(999999)).rejects.toThrow(AdminNotFoundError);
  });

  it('should return AdminDetailDto with claims from dao', async() => {
    const { id } = await createAdmin.execute(makeCreateInput());

    const result = await sut.execute(id);

    const expectedClaims = [
      Claim.BANK_READ,
      Claim.FAQ_READ,
    ];

    expect(result).toEqual<AdminDetailDto>({
      id,
      name: 'Maria Admin',
      email: 'maria@test.com',
      document: '52998224725',
      status: AccountStatus.ACTIVE,
      profilePicture: null,
      claims: expect.arrayContaining(expectedClaims),
      subjects: claimValuesToSubjectPermissions(expectedClaims),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(result.claims).toHaveLength(2);
  });
});
