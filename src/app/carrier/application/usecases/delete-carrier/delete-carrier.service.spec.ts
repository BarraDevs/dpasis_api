import { Test } from '@nestjs/testing';
import { CarrierNotFoundError } from 'src/app/carrier/domain/errors/carrier-not-found.error';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CarrierModule } from '../../../carrier.module';
import { CreateCarrier } from '../create-carrier/create-carrier.service';
import { DeleteCarrier } from './delete-carrier.service';

describe('DeleteCarrier - Integration tests', () => {
  let sut: DeleteCarrier;
  let createCarrier: CreateCarrier;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CarrierModule],
    }).compile();

    sut = module.get(DeleteCarrier);
    createCarrier = module.get(CreateCarrier);
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

  it('should throw CarrierNotFoundError when carrier does not exist', async() => {
    // Act / Assert
    await expect(sut.execute(99999)).rejects.toThrow(CarrierNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow('Transportadora não encontrada na base de dados.');
  });

  it('should delete carrier from database and return success message', async() => {
    // Arrange
    const { id } = await createCarrier.execute({
      name: 'Transportadora LTDA',
      fantasyName: 'Transportadora',
      representative: 'João Silva',
      document: '09.748.165/0001-10',
      contact: 'João Silva - (11) 99999-9999',
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '1000',
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    });

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toEqual<SuccessMessage>({ message: 'Transportadora excluída com sucesso' });
    const deleted = await prisma.carrier.findUnique({ where: { id } });
    expect(deleted).toBeNull();
  });
});
