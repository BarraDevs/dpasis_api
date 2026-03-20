import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceDeliveryTermAlreadyExistsError } from '../../../domain/errors/service-delivery-term-already-exists.error';
import { ServiceDeliveryTermNotFoundError } from '../../../domain/errors/service-delivery-term-not-found.error';
import { ServiceDeliveryTermModule } from '../../../service-delivery-term.module';
import { EditServiceDeliveryTermInputDto } from './dtos/edit-service-delivery-term.dto';
import { EditServiceDeliveryTerm } from './edit-service-delivery-term.service';

describe('EditServiceDeliveryTerm - Integration tests', () => {
  let sut: EditServiceDeliveryTerm;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceDeliveryTermModule],
    }).compile();

    sut = module.get(EditServiceDeliveryTerm);
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

  it('should throw ServiceDeliveryTermNotFoundError when service delivery term does not exist', async() => {
    const data: EditServiceDeliveryTermInputDto = { name: `Novo nome ${Date.now()}` };

    await expect(sut.execute(0, data)).rejects.toThrow(ServiceDeliveryTermNotFoundError);
  });

  it('should update service delivery term name', async() => {
    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });

    const data: EditServiceDeliveryTermInputDto = { name: `Nome atualizado ${Date.now()}` };
    await sut.execute(serviceDeliveryTerm.id, data);

    const updated = await prisma.serviceDeliveryTerm.findUnique({ where: { id: serviceDeliveryTerm.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: true },
    });

    const data: EditServiceDeliveryTermInputDto = { name: `Novo nome ${Date.now()}` };
    const result = await sut.execute(serviceDeliveryTerm.id, data);

    expect(result).toEqual({ message: 'Prazo de entrega atualizado com sucesso' });
  });

  it('should throw ServiceDeliveryTermAlreadyExistsError when editing to duplicate name', async() => {
    const nameA = `Term A ${Date.now()}`;
    await prisma.serviceDeliveryTerm.create({ data: { name: nameA, active: true } });
    const serviceDeliveryTermB = await prisma.serviceDeliveryTerm.create({
      data: { name: `Term B ${Date.now()}`, active: true },
    });

    const data: EditServiceDeliveryTermInputDto = { name: nameA };
    await expect(sut.execute(serviceDeliveryTermB.id, data)).rejects.toThrow(ServiceDeliveryTermAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same service delivery term being edited', async() => {
    const name = `Term ${Date.now()}`;
    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({ data: { name, active: true } });

    const data: EditServiceDeliveryTermInputDto = { name };
    await sut.execute(serviceDeliveryTerm.id, data);

    const updated = await prisma.serviceDeliveryTerm.findUnique({ where: { id: serviceDeliveryTerm.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
