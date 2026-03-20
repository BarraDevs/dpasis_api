import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceProposalValidityNotFoundError } from '../../../domain/errors/service-proposal-validity-not-found.error';
import { ServiceProposalValidityModule } from '../../../service-proposal-validity.module';
import { ServiceProposalValidityDto } from '../../dtos/service-proposal-validity.dto';
import { FindServiceProposalValidityById } from './find-service-proposal-validity-by-id.service';

describe('FindServiceProposalValidityById - Integration tests', () => {
  let sut: FindServiceProposalValidityById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceProposalValidityModule],
    }).compile();

    sut = module.get(FindServiceProposalValidityById);
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

  it('should throw ServiceProposalValidityNotFoundError when service proposal validity does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ServiceProposalValidityNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow('Validade de proposta não encontrada na base de dados.');
  });

  it('should throw ServiceProposalValidityNotFoundError when service proposal validity is inactive and onlyActive is true', async() => {
    const serviceProposalValidity = await prisma.serviceProposalValidity.create({
      data: { name: `Validity Premium ${Date.now()}`, active: false },
    });

    await expect(sut.execute(serviceProposalValidity.id, { onlyActive: true })).rejects.toThrow(ServiceProposalValidityNotFoundError);
    await expect(sut.execute(serviceProposalValidity.id, { onlyActive: true })).rejects.toThrow('Validade de proposta não encontrada na base de dados.');
  });

  it('should return service proposal validity by id', async() => {
    const serviceProposalValidity = await prisma.serviceProposalValidity.create({
      data: { name: `Validity Premium ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceProposalValidity.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(serviceProposalValidity.id);
    expect(result.name).toBe(serviceProposalValidity.name);
    expect(result.active).toBe(serviceProposalValidity.active);
  });

  it('should return all service proposal validity fields correctly', async() => {
    const serviceProposalValidity = await prisma.serviceProposalValidity.create({
      data: { name: `Validity VIP ${Date.now()}`, active: false },
    });

    const result = await sut.execute(serviceProposalValidity.id);

    expect(result).toEqual<ServiceProposalValidityDto>({
      id: serviceProposalValidity.id,
      name: serviceProposalValidity.name,
      active: serviceProposalValidity.active,
      createdAt: serviceProposalValidity.createdAt,
      updatedAt: serviceProposalValidity.updatedAt,
    });
  });
});
