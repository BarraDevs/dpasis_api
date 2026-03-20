import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceProposalValidityAlreadyExistsError } from '../../../domain/errors/service-proposal-validity-already-exists.error';
import { ServiceProposalValidityNotFoundError } from '../../../domain/errors/service-proposal-validity-not-found.error';
import { ServiceProposalValidityModule } from '../../../service-proposal-validity.module';
import { EditServiceProposalValidityInputDto } from './dtos/edit-service-proposal-validity.dto';
import { EditServiceProposalValidity } from './edit-service-proposal-validity.service';

describe('EditServiceProposalValidity - Integration tests', () => {
  let sut: EditServiceProposalValidity;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceProposalValidityModule],
    }).compile();

    sut = module.get(EditServiceProposalValidity);
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
    const data: EditServiceProposalValidityInputDto = { name: `Novo nome ${Date.now()}` };

    await expect(sut.execute(0, data)).rejects.toThrow(ServiceProposalValidityNotFoundError);
  });

  it('should update service proposal validity name', async() => {
    const serviceProposalValidity = await prisma.serviceProposalValidity.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });

    const data: EditServiceProposalValidityInputDto = { name: `Nome atualizado ${Date.now()}` };
    await sut.execute(serviceProposalValidity.id, data);

    const updated = await prisma.serviceProposalValidity.findUnique({ where: { id: serviceProposalValidity.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const serviceProposalValidity = await prisma.serviceProposalValidity.create({
      data: { name: `Validity ${Date.now()}`, active: true },
    });

    const data: EditServiceProposalValidityInputDto = { name: `Novo nome ${Date.now()}` };
    const result = await sut.execute(serviceProposalValidity.id, data);

    expect(result).toEqual({ message: 'Validade de proposta atualizada com sucesso' });
  });

  it('should throw ServiceProposalValidityAlreadyExistsError when editing to duplicate name', async() => {
    const nameA = `Validity A ${Date.now()}`;
    await prisma.serviceProposalValidity.create({ data: { name: nameA, active: true } });
    const serviceProposalValidityB = await prisma.serviceProposalValidity.create({
      data: { name: `Validity B ${Date.now()}`, active: true },
    });

    const data: EditServiceProposalValidityInputDto = { name: nameA };
    await expect(sut.execute(serviceProposalValidityB.id, data)).rejects.toThrow(ServiceProposalValidityAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same service proposal validity being edited', async() => {
    const name = `Validity ${Date.now()}`;
    const serviceProposalValidity = await prisma.serviceProposalValidity.create({ data: { name, active: true } });

    const data: EditServiceProposalValidityInputDto = { name };
    await sut.execute(serviceProposalValidity.id, data);

    const updated = await prisma.serviceProposalValidity.findUnique({ where: { id: serviceProposalValidity.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
