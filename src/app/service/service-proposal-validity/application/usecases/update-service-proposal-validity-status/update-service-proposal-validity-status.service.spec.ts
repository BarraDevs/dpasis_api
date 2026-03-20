import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceProposalValidityNotFoundError } from '../../../domain/errors/service-proposal-validity-not-found.error';
import { ServiceProposalValidityModule } from '../../../service-proposal-validity.module';
import { UpdateServiceProposalValidityStatus } from './update-service-proposal-validity-status.service';

describe('UpdateServiceProposalValidityStatus - Integration tests', () => {
  let sut: UpdateServiceProposalValidityStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceProposalValidityModule],
    }).compile();

    sut = module.get(UpdateServiceProposalValidityStatus);
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
  });

  it('should invert active from true to false', async() => {
    const serviceProposalValidity = await prisma.serviceProposalValidity.create({
      data: { name: `Validity ${Date.now()}`, active: true },
    });

    await sut.execute(serviceProposalValidity.id);

    const updated = await prisma.serviceProposalValidity.findUnique({ where: { id: serviceProposalValidity.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const serviceProposalValidity = await prisma.serviceProposalValidity.create({
      data: { name: `Validity ${Date.now()}`, active: false },
    });

    await sut.execute(serviceProposalValidity.id);

    const updated = await prisma.serviceProposalValidity.findUnique({ where: { id: serviceProposalValidity.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const serviceProposalValidity = await prisma.serviceProposalValidity.create({
      data: { name: `Validity ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceProposalValidity.id);

    expect(result).toEqual({ message: 'Status da validade de proposta atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    const serviceProposalValidity = await prisma.serviceProposalValidity.create({
      data: { name: `30 dias ${Date.now()}`, active: true },
    });

    await sut.execute(serviceProposalValidity.id);

    const updated = await prisma.serviceProposalValidity.findUnique({ where: { id: serviceProposalValidity.id } });
    expect(updated?.name).toBe(serviceProposalValidity.name);
    expect(updated?.active).toBe(false);
  });
});
