import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProposalValidityAlreadyExistsError } from '../../../domain/errors/proposal-validity-already-exists.error';
import { ProposalValidityModule } from '../../../proposal-validity.module';
import { CreateProposalValidity } from './create-proposal-validity.service';
import { CreateProposalValidityInputDto } from './dtos/create-proposal-validity.dto';

describe('CreateProposalValidity - Integration tests', () => {
  let sut: CreateProposalValidity;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProposalValidityModule],
    }).compile();

    sut = module.get(CreateProposalValidity);
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

  it('should throw ProposalValidityAlreadyExistsError when creating with duplicate name', async() => {
    const name = `Validity ${Date.now()}-${Math.random()}`;

    const input: CreateProposalValidityInputDto = { name };
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(ProposalValidityAlreadyExistsError);
  });

  it('should create validity and return id', async() => {
    const input: CreateProposalValidityInputDto = {
      name: `30 dias ${Date.now()}-${Math.random()}`,
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.proposalValidity.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist validity in database', async() => {
    const input: CreateProposalValidityInputDto = {
      name: `90 dias ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input);

    const validityRow = await prisma.proposalValidity.findUnique({ where: { id } });
    expect(validityRow).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(validityRow?.createdAt).toBeInstanceOf(Date);
    expect(validityRow?.updatedAt).toBeInstanceOf(Date);
  });
});
