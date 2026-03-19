import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientContactModule } from '../../../client-contact.module';
import { ClientContactDto } from '../../dtos/client-contact.dto';
import { FindAllClientContactQueryDto } from './dtos/find-all-client-contact.dto';
import { FindAllClientContact } from './find-all-client-contact.service';

describe('FindAllClientContact - Integration tests', () => {
  let sut: FindAllClientContact;
  let prisma: PrismaService;
  let clientId: number;
  let departmentId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientContactModule],
    }).compile();

    sut = module.get(FindAllClientContact);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, owner, department] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      prisma.clientDepartment.create({ data: { name: `Dept ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    clientId = client.id;
    departmentId = department.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return empty results when no client contacts exist', async() => {
    const query: FindAllClientContactQueryDto = { clientId };

    const result = await sut.execute(query);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all client contacts with pagination', async() => {
    await prisma.clientContact.createMany({
      data: [
        { clientId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: false },
        { clientId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: true },
        { clientId, departmentId, name: 'Pedro', email: 'pedro@example.com', receiveNF: false },
      ],
    });

    const result = await sut.execute({ clientId, page: 1, size: 10 });

    expect(result.data).toHaveLength(3);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate results correctly', async() => {
    await prisma.clientContact.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        clientId,
        departmentId,
        name: `Contact ${i + 1}`,
        email: `contact${i + 1}@example.com`,
        receiveNF: false,
      })),
    });

    const page1 = await sut.execute({ clientId, page: 1, size: 10 });
    const page3 = await sut.execute({ clientId, page: 3, size: 10 });

    expect(page1.data).toHaveLength(10);
    expect(page1.totalItems).toBe(25);
    expect(page1.currentPage).toBe(1);
    expect(page1.totalPages).toBe(3);

    expect(page3.data).toHaveLength(5);
    expect(page3.currentPage).toBe(3);
  });

  it('should order by name asc', async() => {
    const first = await prisma.clientContact.create({
      data: { clientId, departmentId, name: 'B', email: 'b@example.com', receiveNF: false },
    });
    const second = await prisma.clientContact.create({
      data: { clientId, departmentId, name: 'A', email: 'a@example.com', receiveNF: false },
    });
    const third = await prisma.clientContact.create({
      data: { clientId, departmentId, name: 'C', email: 'c@example.com', receiveNF: false },
    });

    const result = await sut.execute({ clientId, page: 1, size: 10 });

    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by active when active is true', async() => {
    await prisma.clientContact.createMany({
      data: [
        { clientId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: false, active: true },
        { clientId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: false, active: false },
        { clientId, departmentId, name: 'Pedro', email: 'pedro@example.com', receiveNF: false, active: true },
      ],
    });

    const result = await sut.execute({ clientId, page: 1, size: 10, active: true });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((c: ClientContactDto) => c.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    await prisma.clientContact.createMany({
      data: [
        { clientId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: false, active: true },
        { clientId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: false, active: false },
        { clientId, departmentId, name: 'Pedro', email: 'pedro@example.com', receiveNF: false, active: false },
      ],
    });

    const result = await sut.execute({ clientId, page: 1, size: 10, active: false });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((c: ClientContactDto) => !c.active)).toBe(true);
  });

  it('should filter by search in name and email', async() => {
    await prisma.clientContact.createMany({
      data: [
        { clientId, departmentId, name: 'João Premium', email: 'joao@example.com', receiveNF: false },
        { clientId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: false },
        { clientId, departmentId, name: 'Pedro', email: 'pedro.premium@example.com', receiveNF: false },
      ],
    });

    const result = await sut.execute({ clientId, page: 1, size: 10, search: 'Premium' });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ClientContactDto) =>
      d.name.toLowerCase().includes('premium') || d.email.toLowerCase().includes('premium'))).toBe(true);
  });

  it('should filter by departmentId', async() => {
    const dept2 = await prisma.clientDepartment.create({
      data: { name: `Dept2 ${Date.now()}`, active: true },
    });
    await prisma.clientContact.create({
      data: { clientId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: false },
    });
    await prisma.clientContact.create({
      data: { clientId, departmentId: dept2.id, name: 'Maria', email: 'maria@example.com', receiveNF: false },
    });

    const result = await sut.execute({ clientId, page: 1, size: 10, departmentId });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('João');
  });

  it('should filter by receiveNF', async() => {
    await prisma.clientContact.createMany({
      data: [
        { clientId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: true },
        { clientId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: false },
      ],
    });

    const result = await sut.execute({ clientId, page: 1, size: 10, receiveNF: true });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('João');
    expect(result.data[0].receiveNF).toBe(true);
  });

  it('should return correct ClientContactDto structure', async() => {
    const clientContact = await prisma.clientContact.create({
      data: {
        clientId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        receiveNF: false,
      },
    });

    const result = await sut.execute({ clientId, page: 1, size: 10 });

    expect(result.data[0]).toEqual<ClientContactDto>({
      id: clientContact.id,
      clientId: clientContact.clientId,
      name: clientContact.name,
      department: {
        id: clientContact.departmentId,
        name: expect.any(String),
      },
      email: clientContact.email,
      phone: clientContact.phone,
      whatsapp: clientContact.whatsapp,
      observations: clientContact.observations,
      receiveNF: clientContact.receiveNF,
      active: clientContact.active,
      createdAt: clientContact.createdAt,
      updatedAt: clientContact.updatedAt,
    });
  });
});
