import { Test } from '@nestjs/testing';
import { PermissionLevel } from 'src/app/admin/application/permission/permission-level.enum';
import { ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AdminModule } from '../../../admin.module';
import { CreateAdmin } from '../create-admin/create-admin.service';
import { CreateAdminInputDto } from '../create-admin/dtos/create-admin.dto';
import { FindAllAdmin } from './find-all-admin.service';

describe('FindAllAdmin - Integration tests', () => {
  let sut: FindAllAdmin;
  let createAdmin: CreateAdmin;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [AdminModule],
    }).compile();

    sut = module.get(FindAllAdmin);
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
      name: 'Admin',
      email: 'admin@test.com',
      password: 'SenhaForte123',
      document: '529.982.247-25',
      profilePicture: null,
      subjects: [
        { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Read },
      ],
      ...overrides,
    };
  }

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return empty pagination when there are no admins', async() => {
    const result = await sut.execute({});

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('should return all admins when page and size are omitted', async() => {
    await createAdmin.execute(
      makeCreateInput({ name: 'Primeiro', email: 'a@test.com', document: '529.982.247-25' }),
    );
    await createAdmin.execute(
      makeCreateInput({ name: 'Segundo', email: 'b@test.com', document: '390.533.447-05' }),
    );

    const result = await sut.execute({});

    expect(result.totalItems).toBe(2);
    expect(result.data).toHaveLength(2);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(2);
    expect(result.totalPages).toBe(1);
    const names = result.data.map(r => r.name).sort();
    expect(names).toEqual(['Primeiro', 'Segundo']);
  });

  it('should paginate when page and size are provided', async() => {
    await createAdmin.execute(
      makeCreateInput({ email: 'a@test.com', document: '529.982.247-25' }),
    );
    await createAdmin.execute(
      makeCreateInput({ email: 'b@test.com', document: '390.533.447-05' }),
    );

    const page1 = await sut.execute({ page: 1, size: 1 });

    expect(page1.data).toHaveLength(1);
    expect(page1.totalItems).toBe(2);
    expect(page1.totalPages).toBe(2);
    expect(page1.currentPage).toBe(1);
    expect(page1.itemsPerPage).toBe(1);
  });
});
