import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceProposalValidityModule } from '../../../service-proposal-validity.module';
import { ServiceProposalValidityDto } from '../../dtos/service-proposal-validity.dto';
import { FindAllServiceProposalValidityQueryDto } from './dtos/find-all-service-proposal-validity.dto';
import { FindAllServiceProposalValidity } from './find-all-service-proposal-validity.service';

describe('FindAllServiceProposalValidity - Integration tests', () => {
  let sut: FindAllServiceProposalValidity;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceProposalValidityModule],
    }).compile();

    sut = module.get(FindAllServiceProposalValidity);
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

  it('should return empty results when no service proposal validities exist', async() => {
    const query: FindAllServiceProposalValidityQueryDto = {};

    const result = await sut.execute(query);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all service proposal validities with pagination', async() => {
    await prisma.serviceProposalValidity.createMany({
      data: [
        { name: `Validity 1 ${Date.now()}`, active: true },
        { name: `Validity 2 ${Date.now()}`, active: false },
        { name: `Validity 3 ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data).toHaveLength(3);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate results correctly', async() => {
    await prisma.serviceProposalValidity.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        name: `Validity ${Date.now()}-${i + 1}`,
        active: true,
      })),
    });

    const page1 = await sut.execute({ page: 1, size: 10 });
    const page3 = await sut.execute({ page: 3, size: 10 });

    expect(page1.data).toHaveLength(10);
    expect(page1.totalItems).toBe(25);
    expect(page1.currentPage).toBe(1);
    expect(page1.totalPages).toBe(3);

    expect(page3.data).toHaveLength(5);
    expect(page3.currentPage).toBe(3);
  });

  it('should order by name asc', async() => {
    const first = await prisma.serviceProposalValidity.create({
      data: { name: `B-${Date.now()}`, active: true },
    });
    const second = await prisma.serviceProposalValidity.create({
      data: { name: `A-${Date.now()}`, active: true },
    });
    const third = await prisma.serviceProposalValidity.create({
      data: { name: `C-${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by active when active is true', async() => {
    await prisma.serviceProposalValidity.createMany({
      data: [
        { name: `Validity A ${Date.now()}`, active: true },
        { name: `Validity B ${Date.now()}`, active: false },
        { name: `Validity C ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: true });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ServiceProposalValidityDto) => d.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    await prisma.serviceProposalValidity.createMany({
      data: [
        { name: `Validity A ${Date.now()}`, active: true },
        { name: `Validity B ${Date.now()}`, active: false },
        { name: `Validity C ${Date.now()}`, active: false },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: false });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ServiceProposalValidityDto) => !d.active)).toBe(true);
  });

  it('should filter by search in name', async() => {
    await prisma.serviceProposalValidity.createMany({
      data: [
        { name: '30 dias', active: true },
        { name: '90 dias', active: true },
        { name: '30 dias estendido', active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, search: '30' });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ServiceProposalValidityDto) => d.name.includes('30'))).toBe(true);
  });

  it('should return correct ServiceProposalValidityDto structure', async() => {
    const serviceProposalValidity = await prisma.serviceProposalValidity.create({
      data: { name: `Validity Test ${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0]).toEqual<ServiceProposalValidityDto>({
      id: serviceProposalValidity.id,
      name: serviceProposalValidity.name,
      active: serviceProposalValidity.active,
      createdAt: serviceProposalValidity.createdAt,
      updatedAt: serviceProposalValidity.updatedAt,
    });
  });
});
