import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceWarrantyAlreadyExistsError } from '../../../domain/errors/service-warranty-already-exists.error';
import { ServiceWarrantyNotFoundError } from '../../../domain/errors/service-warranty-not-found.error';
import { ServiceWarrantyModule } from '../../../service-warranty.module';
import { EditServiceWarrantyInputDto } from './dtos/edit-service-warranty.dto';
import { EditServiceWarranty } from './edit-service-warranty.service';

describe('EditServiceWarranty - Integration tests', () => {
  let sut: EditServiceWarranty;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceWarrantyModule],
    }).compile();

    sut = module.get(EditServiceWarranty);
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

  it('should throw ServiceWarrantyNotFoundError when service warranty does not exist', async() => {
    const data: EditServiceWarrantyInputDto = { name: `Novo nome ${Date.now()}` };

    await expect(sut.execute(0, data)).rejects.toThrow(ServiceWarrantyNotFoundError);
  });

  it('should update service warranty name', async() => {
    const serviceWarranty = await prisma.serviceWarranty.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });

    const data: EditServiceWarrantyInputDto = { name: `Nome atualizado ${Date.now()}` };
    await sut.execute(serviceWarranty.id, data);

    const updated = await prisma.serviceWarranty.findUnique({ where: { id: serviceWarranty.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const serviceWarranty = await prisma.serviceWarranty.create({
      data: { name: `Warranty ${Date.now()}`, active: true },
    });

    const data: EditServiceWarrantyInputDto = { name: `Novo nome ${Date.now()}` };
    const result = await sut.execute(serviceWarranty.id, data);

    expect(result).toEqual({ message: 'Garantia de serviço atualizada com sucesso' });
  });

  it('should throw ServiceWarrantyAlreadyExistsError when editing to duplicate name', async() => {
    const nameA = `Warranty A ${Date.now()}`;
    await prisma.serviceWarranty.create({ data: { name: nameA, active: true } });
    const serviceWarrantyB = await prisma.serviceWarranty.create({
      data: { name: `Warranty B ${Date.now()}`, active: true },
    });

    const data: EditServiceWarrantyInputDto = { name: nameA };
    await expect(sut.execute(serviceWarrantyB.id, data)).rejects.toThrow(ServiceWarrantyAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same service warranty being edited', async() => {
    const name = `Warranty ${Date.now()}`;
    const serviceWarranty = await prisma.serviceWarranty.create({ data: { name, active: true } });

    const data: EditServiceWarrantyInputDto = { name };
    await sut.execute(serviceWarranty.id, data);

    const updated = await prisma.serviceWarranty.findUnique({ where: { id: serviceWarranty.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
