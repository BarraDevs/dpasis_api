import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceProposalValidityNotFoundError } from '../../../domain/errors/service-proposal-validity-not-found.error';
import { ServiceProposalValidityModule } from '../../../service-proposal-validity.module';
import { DeleteServiceProposalValidity } from './delete-service-proposal-validity.service';

describe('DeleteServiceProposalValidity - Integration tests', () => {
  let sut: DeleteServiceProposalValidity;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceProposalValidityModule],
    }).compile();

    sut = module.get(DeleteServiceProposalValidity);
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

  it('should delete service proposal validity from database', async() => {
    const serviceProposalValidity = await prisma.serviceProposalValidity.create({
      data: { name: `Validity ${Date.now()}`, active: true },
    });

    await sut.execute(serviceProposalValidity.id);

    const deleted = await prisma.serviceProposalValidity.findUnique({ where: { id: serviceProposalValidity.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const serviceProposalValidity = await prisma.serviceProposalValidity.create({
      data: { name: `Validity ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceProposalValidity.id);

    expect(result).toEqual({ message: 'Validade de proposta excluída com sucesso' });
  });
});
