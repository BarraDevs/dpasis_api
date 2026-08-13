import { Test } from '@nestjs/testing';
import { DepartmentInUseError } from 'src/app/global/department/domain/errors/department-in-use.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { DepartmentModule } from '../../../department.module';
import { DepartmentNotFoundError } from '../../../domain/errors/department-not-found.error';
import { DeleteDepartment } from './delete-department.service';

describe('DeleteDepartment - Integration tests', () => {
  let sut: DeleteDepartment;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [DepartmentModule],
    }).compile();

    sut = module.get(DeleteDepartment);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw DepartmentNotFoundError when department does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(DepartmentNotFoundError);
  });

  it('should throw DepartmentInUseError when there are linked contacts', async() => {
    const department = await prisma.department.create({
      data: { name: `Dept ${Date.now()}`, active: true },
    });
    const [group, resale, company] = await Promise.all([
      prisma.clientGroup.create({ data: { name: 'Grupo', active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.company.create({ data: buildMinimalCompanyData() }),
    ]);
    const client = await prisma.client.create({
      data: {
        id: 1,
        type: 'PJ',
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        companyName: 'Empresa',
        fantasyName: null,
        headquarters: 'SP',
        invoiceType: 'CONTRACT',
        generateInvoice: true,
        active: true,
      },
    });
    await prisma.clientContact.create({
      data: {
        clientId: client.id,
        departmentId: department.id,
        name: 'Contato',
        email: 'contato@test.com',
        receiveNF: true,
        active: true,
      },
    });

    await expect(sut.execute(department.id)).rejects.toThrow(DepartmentInUseError);
    await expect(sut.execute(department.id)).rejects.toThrow('Não é possível excluir o departamento pois existem contatos vinculados.');

    const stillExists = await prisma.department.findUnique({ where: { id: department.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete department from database', async() => {
    const departmentRow = await prisma.department.create({
      data: { name: `Department ${Date.now()}`, active: true },
    });

    await sut.execute(departmentRow.id);

    const deleted = await prisma.department.findUnique({ where: { id: departmentRow.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const departmentRow = await prisma.department.create({
      data: { name: `Department ${Date.now()}`, active: true },
    });

    const result = await sut.execute(departmentRow.id);

    expect(result).toEqual({ message: 'Departamento excluído com sucesso' });
  });
});
