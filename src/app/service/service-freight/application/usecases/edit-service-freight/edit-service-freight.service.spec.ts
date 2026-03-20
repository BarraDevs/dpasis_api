import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceFreightAlreadyExistsError } from '../../../domain/errors/service-freight-already-exists.error';
import { ServiceFreightNotFoundError } from '../../../domain/errors/service-freight-not-found.error';
import { ServiceFreightModule } from '../../../service-freight.module';
import { EditServiceFreightInputDto } from './dtos/edit-service-freight.dto';
import { EditServiceFreight } from './edit-service-freight.service';

describe('EditServiceFreight - Integration tests', () => {
  let sut: EditServiceFreight;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceFreightModule],
    }).compile();

    sut = module.get(EditServiceFreight);
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

  it('should throw ServiceFreightNotFoundError when service freight does not exist', async() => {
    const data: EditServiceFreightInputDto = { name: `Novo nome ${Date.now()}` };

    await expect(sut.execute(0, data)).rejects.toThrow(ServiceFreightNotFoundError);
  });

  it('should update service freight name', async() => {
    const serviceFreight = await prisma.serviceFreight.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });

    const data: EditServiceFreightInputDto = { name: `Nome atualizado ${Date.now()}` };
    await sut.execute(serviceFreight.id, data);

    const updated = await prisma.serviceFreight.findUnique({ where: { id: serviceFreight.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const serviceFreight = await prisma.serviceFreight.create({
      data: { name: `Freight ${Date.now()}`, active: true },
    });

    const data: EditServiceFreightInputDto = { name: `Novo nome ${Date.now()}` };
    const result = await sut.execute(serviceFreight.id, data);

    expect(result).toEqual({ message: 'Frete de serviço atualizado com sucesso' });
  });

  it('should throw ServiceFreightAlreadyExistsError when editing to duplicate name', async() => {
    const nameA = `Freight A ${Date.now()}`;
    await prisma.serviceFreight.create({ data: { name: nameA, active: true } });
    const serviceFreightB = await prisma.serviceFreight.create({
      data: { name: `Freight B ${Date.now()}`, active: true },
    });

    const data: EditServiceFreightInputDto = { name: nameA };
    await expect(sut.execute(serviceFreightB.id, data)).rejects.toThrow(ServiceFreightAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same service freight being edited', async() => {
    const name = `Freight ${Date.now()}`;
    const serviceFreight = await prisma.serviceFreight.create({ data: { name, active: true } });

    const data: EditServiceFreightInputDto = { name };
    await sut.execute(serviceFreight.id, data);

    const updated = await prisma.serviceFreight.findUnique({ where: { id: serviceFreight.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
