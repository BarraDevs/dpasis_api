import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProposalValidityAlreadyExistsError } from '../../../domain/errors/proposal-validity-already-exists.error';
import { ProposalValidityNotFoundError } from '../../../domain/errors/proposal-validity-not-found.error';
import { ProposalValidityModule } from '../../../proposal-validity.module';
import { EditProposalValidityInputDto } from './dtos/edit-proposal-validity.dto';
import { EditProposalValidity } from './edit-proposal-validity.service';

describe('EditProposalValidity - Integration tests', () => {
  let sut: EditProposalValidity;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProposalValidityModule],
    }).compile();

    sut = module.get(EditProposalValidity);
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
    const data: EditProposalValidityInputDto = { name: `Novo nome ${Date.now()}` };

    await expect(sut.execute(0, data)).rejects.toThrow(ProposalValidityNotFoundError);
  });

  it('should update validity name', async() => {
    const validityRow = await prisma.proposalValidity.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });

    const data: EditProposalValidityInputDto = { name: `Nome atualizado ${Date.now()}` };
    await sut.execute(validityRow.id, data);

    const updated = await prisma.proposalValidity.findUnique({ where: { id: validityRow.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const validityRow = await prisma.proposalValidity.create({
      data: { name: `Validity ${Date.now()}`, active: true },
    });

    const data: EditProposalValidityInputDto = { name: `Novo nome ${Date.now()}` };
    const result = await sut.execute(validityRow.id, data);

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
  });

  it('should throw ProposalValidityAlreadyExistsError when editing to duplicate name', async() => {
    const nameA = `Validity A ${Date.now()}`;
    await prisma.proposalValidity.create({ data: { name: nameA, active: true } });
    const validityB = await prisma.proposalValidity.create({
      data: { name: `Validity B ${Date.now()}`, active: true },
    });

    const data: EditProposalValidityInputDto = { name: nameA };
    await expect(sut.execute(validityB.id, data)).rejects.toThrow(ProposalValidityAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same validity being edited', async() => {
    const name = `Validity ${Date.now()}`;
    const validityRow = await prisma.proposalValidity.create({ data: { name, active: true } });

    const data: EditProposalValidityInputDto = { name };
    await sut.execute(validityRow.id, data);

    const updated = await prisma.proposalValidity.findUnique({ where: { id: validityRow.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
