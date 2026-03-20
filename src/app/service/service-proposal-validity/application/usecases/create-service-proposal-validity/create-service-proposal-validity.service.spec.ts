import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceProposalValidityAlreadyExistsError } from '../../../domain/errors/service-proposal-validity-already-exists.error';
import { ServiceProposalValidityModule } from '../../../service-proposal-validity.module';
import { CreateServiceProposalValidity } from './create-service-proposal-validity.service';
import { CreateServiceProposalValidityInputDto } from './dtos/create-service-proposal-validity.dto';

describe('CreateServiceProposalValidity - Integration tests', () => {
  let sut: CreateServiceProposalValidity;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceProposalValidityModule],
    }).compile();

    sut = module.get(CreateServiceProposalValidity);
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

  it('should throw ServiceProposalValidityAlreadyExistsError when creating with duplicate name', async() => {
    const name = `Validity ${Date.now()}-${Math.random()}`;

    const input: CreateServiceProposalValidityInputDto = { name };
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(ServiceProposalValidityAlreadyExistsError);
  });

  it('should create service proposal validity and return id', async() => {
    const input: CreateServiceProposalValidityInputDto = {
      name: `30 dias ${Date.now()}-${Math.random()}`,
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.serviceProposalValidity.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist service proposal validity in database', async() => {
    const input: CreateServiceProposalValidityInputDto = {
      name: `90 dias ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input);

    const serviceProposalValidity = await prisma.serviceProposalValidity.findUnique({ where: { id } });
    expect(serviceProposalValidity).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(serviceProposalValidity?.createdAt).toBeInstanceOf(Date);
    expect(serviceProposalValidity?.updatedAt).toBeInstanceOf(Date);
  });
});
