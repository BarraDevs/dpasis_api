import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProposalValidityNotFoundError } from '../../../domain/errors/proposal-validity-not-found.error';
import { ProposalValidityModule } from '../../../proposal-validity.module';
import { ProposalValidityDto } from '../../dtos/proposal-validity.dto';
import { FindProposalValidityById } from './find-proposal-validity-by-id.service';

describe('FindProposalValidityById - Integration tests', () => {
  let sut: FindProposalValidityById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProposalValidityModule],
    }).compile();

    sut = module.get(FindProposalValidityById);
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

  it('should throw ProposalValidityNotFoundError when validity does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ProposalValidityNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow('Validade não encontrada na base de dados.');
  });

  it('should throw ProposalValidityNotFoundError when validity is inactive and onlyActive is true', async() => {
    const validityRow = await prisma.proposalValidity.create({
      data: { name: `Validity Premium ${Date.now()}`, active: false },
    });

    await expect(sut.execute(validityRow.id, { onlyActive: true })).rejects.toThrow(ProposalValidityNotFoundError);
    await expect(sut.execute(validityRow.id, { onlyActive: true })).rejects.toThrow('Validade não encontrada na base de dados.');
  });

  it('should return validity by id', async() => {
    const validityRow = await prisma.proposalValidity.create({
      data: { name: `Validity Premium ${Date.now()}`, active: true },
    });

    const result = await sut.execute(validityRow.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(validityRow.id);
    expect(result.name).toBe(validityRow.name);
    expect(result.active).toBe(validityRow.active);
  });

  it('should return all validity fields correctly', async() => {
    const validityRow = await prisma.proposalValidity.create({
      data: { name: `Validity VIP ${Date.now()}`, active: false },
    });

    const result = await sut.execute(validityRow.id);

    expect(result).toEqual<ProposalValidityDto>({
      id: validityRow.id,
      name: validityRow.name,
      active: validityRow.active,
      createdAt: validityRow.createdAt,
      updatedAt: validityRow.updatedAt,
    });
  });
});
