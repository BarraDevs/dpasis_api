import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProposalValidityNotFoundError } from '../../../domain/errors/proposal-validity-not-found.error';
import { ProposalValidityModule } from '../../../proposal-validity.module';
import { UpdateProposalValidityStatus } from './update-proposal-validity-status.service';

describe('UpdateProposalValidityStatus - Integration tests', () => {
  let sut: UpdateProposalValidityStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProposalValidityModule],
    }).compile();

    sut = module.get(UpdateProposalValidityStatus);
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
  });

  it('should invert active from true to false', async() => {
    const validityRow = await prisma.proposalValidity.create({
      data: { name: `Validity ${Date.now()}`, active: true },
    });

    await sut.execute(validityRow.id);

    const updated = await prisma.proposalValidity.findUnique({ where: { id: validityRow.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const validityRow = await prisma.proposalValidity.create({
      data: { name: `Validity ${Date.now()}`, active: false },
    });

    await sut.execute(validityRow.id);

    const updated = await prisma.proposalValidity.findUnique({ where: { id: validityRow.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const validityRow = await prisma.proposalValidity.create({
      data: { name: `Validity ${Date.now()}`, active: true },
    });

    const result = await sut.execute(validityRow.id);

    expect(result).toEqual({ message: 'Status da validade atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    const validityRow = await prisma.proposalValidity.create({
      data: { name: `30 dias ${Date.now()}`, active: true },
    });

    await sut.execute(validityRow.id);

    const updated = await prisma.proposalValidity.findUnique({ where: { id: validityRow.id } });
    expect(updated?.name).toBe(validityRow.name);
    expect(updated?.active).toBe(false);
  });
});
