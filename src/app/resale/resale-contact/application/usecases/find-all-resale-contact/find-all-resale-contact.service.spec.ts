import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleContactModule } from '../../../resale-contact.module';
import { ResaleContactDto } from '../../dtos/resale-contact.dto';
import { FindAllResaleContactExecuteQuery } from './dtos/find-all-resale-contact.dto';
import { FindAllResaleContact } from './find-all-resale-contact.service';

describe('FindAllResaleContact - Integration tests', () => {
  let sut: FindAllResaleContact;
  let prisma: PrismaService;
  let resaleId: number;
  let departmentId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleContactModule],
    }).compile();

    sut = module.get(FindAllResaleContact);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const resale = await prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) });
    const department = await prisma.resaleDepartment.create({
      data: { name: `Dept ${Date.now()}`, active: true },
    });

    resaleId = resale.id;
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
    const query: FindAllResaleContactExecuteQuery = { resaleId };

    const result = await sut.execute(query);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all client contacts with pagination', async() => {
    await prisma.resaleContact.createMany({
      data: [
        { resaleId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: false, active: true },
        { resaleId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: true, active: true },
        { resaleId, departmentId, name: 'Pedro', email: 'pedro@example.com', receiveNF: false, active: true },
      ],
    });

    const result = await sut.execute({ resaleId, page: 1, size: 10 });

    expect(result.data).toHaveLength(3);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate results correctly', async() => {
    await prisma.resaleContact.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        resaleId,
        departmentId,
        name: `Contact ${i + 1}`,
        email: `contact${i + 1}@example.com`,
        receiveNF: false,
        active: true,
      })),
    });

    const page1 = await sut.execute({ resaleId, page: 1, size: 10 });
    const page3 = await sut.execute({ resaleId, page: 3, size: 10 });

    expect(page1.data).toHaveLength(10);
    expect(page1.totalItems).toBe(25);
    expect(page1.currentPage).toBe(1);
    expect(page1.totalPages).toBe(3);

    expect(page3.data).toHaveLength(5);
    expect(page3.currentPage).toBe(3);
  });

  it('should order by name asc', async() => {
    const first = await prisma.resaleContact.create({
      data: { resaleId, departmentId, name: 'B', email: 'b@example.com', receiveNF: false, active: true },
    });
    const second = await prisma.resaleContact.create({
      data: { resaleId, departmentId, name: 'A', email: 'a@example.com', receiveNF: false, active: true },
    });
    const third = await prisma.resaleContact.create({
      data: { resaleId, departmentId, name: 'C', email: 'c@example.com', receiveNF: false, active: true },
    });

    const result = await sut.execute({ resaleId, page: 1, size: 10 });

    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by active when active is true', async() => {
    await prisma.resaleContact.createMany({
      data: [
        { resaleId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: false, active: true },
        { resaleId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: false, active: false },
        { resaleId, departmentId, name: 'Pedro', email: 'pedro@example.com', receiveNF: false, active: true },
      ],
    });

    const result = await sut.execute({ resaleId, page: 1, size: 10, active: true });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((c: ResaleContactDto) => c.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    await prisma.resaleContact.createMany({
      data: [
        { resaleId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: false, active: true },
        { resaleId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: false, active: false },
        { resaleId, departmentId, name: 'Pedro', email: 'pedro@example.com', receiveNF: false, active: false },
      ],
    });

    const result = await sut.execute({ resaleId, page: 1, size: 10, active: false });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((c: ResaleContactDto) => !c.active)).toBe(true);
  });

  it('should filter by search in name and email', async() => {
    await prisma.resaleContact.createMany({
      data: [
        { resaleId, departmentId, name: 'João Premium', email: 'joao@example.com', receiveNF: false, active: true },
        { resaleId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: false, active: true },
        { resaleId, departmentId, name: 'Pedro', email: 'pedro.premium@example.com', receiveNF: false, active: true },
      ],
    });

    const result = await sut.execute({ resaleId, page: 1, size: 10, search: 'Premium' });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ResaleContactDto) =>
      d.name.toLowerCase().includes('premium') || d.email.toLowerCase().includes('premium'))).toBe(true);
  });

  it('should filter by departmentId', async() => {
    const dept2 = await prisma.resaleDepartment.create({
      data: { name: `Dept2 ${Date.now()}`, active: true },
    });
    await prisma.resaleContact.create({
      data: { resaleId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: false, active: true },
    });
    await prisma.resaleContact.create({
      data: { resaleId, departmentId: dept2.id, name: 'Maria', email: 'maria@example.com', receiveNF: false, active: true },
    });

    const result = await sut.execute({ resaleId, page: 1, size: 10, departmentId });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('João');
  });

  it('should filter by receiveNF', async() => {
    await prisma.resaleContact.createMany({
      data: [
        { resaleId, departmentId, name: 'João', email: 'joao@example.com', receiveNF: true, active: true },
        { resaleId, departmentId, name: 'Maria', email: 'maria@example.com', receiveNF: false, active: true },
      ],
    });

    const result = await sut.execute({ resaleId, page: 1, size: 10, receiveNF: true });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('João');
    expect(result.data[0].receiveNF).toBe(true);
  });

  it('should return correct ResaleContactDto structure', async() => {
    const resaleContact = await prisma.resaleContact.create({
      data: {
        resaleId,
        departmentId,
        name: 'João',
        email: 'joao@example.com',
        receiveNF: false,
        active: true,
      },
    });

    const result = await sut.execute({ resaleId, page: 1, size: 10 });

    expect(result.data[0]).toEqual<ResaleContactDto>({
      id: resaleContact.id,
      resaleId: resaleContact.resaleId,
      name: resaleContact.name,
      department: {
        id: resaleContact.departmentId,
        name: expect.any(String),
      },
      email: resaleContact.email,
      phone: resaleContact.phone,
      whatsapp: resaleContact.whatsapp,
      observations: resaleContact.observations,
      receiveNF: resaleContact.receiveNF,
      active: resaleContact.active,
      createdAt: resaleContact.createdAt,
      updatedAt: resaleContact.updatedAt,
    });
  });
});
