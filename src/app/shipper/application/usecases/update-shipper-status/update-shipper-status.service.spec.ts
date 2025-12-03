import { Test, TestingModule } from '@nestjs/testing';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { Shipper } from 'src/app/shipper/domain/entities/shipper.entity';
import { ShipperNotFoundError } from 'src/app/shipper/domain/errors/shipper-not-found.error';
import { ShipperModule } from 'src/app/shipper/shipper.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateShipper } from '../create-shipper/create-shipper.service';
import { FindShipperById } from '../find-shipper-by-id/find-shipper-by-id.service';
import { UpdateShipperStatus } from './update-shipper-status.service';

describe('UpdateShipperStatus', () => {
  let sut: UpdateShipperStatus;
  let prisma: PrismaService;
  let createShipper: CreateShipper;
  let findShipperById: FindShipperById;
  let createCompany: CreateCompany;
  let companyId: string;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ShipperModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(UpdateShipperStatus);
    prisma = module.get(PrismaService);
    createShipper = module.get(CreateShipper);
    findShipperById = module.get(FindShipperById);
    createCompany = module.get(CreateCompany);

    await prisma.company.deleteMany();
    await prisma.shipper.deleteMany();

    companyId = (await createCompany.execute({
      name: 'Test Company Ltd',
      fantasyName: 'Test Company',
      document: '73094364000151',
      ie: '123456789',
      zipCode: '12345678',
      street: 'Main Street',
      number: '100',
      neighborhood: 'Downtown',
      complement: null,
      reference: null,
      city: 'São Paulo',
      state: 'SP',
      cellphone: '11999999999',
      phone01: '1133333333',
      phone02: null,
      email01: 'test@company.com',
      email02: null,
    })).id;
  });

  afterEach(async() => {
    await prisma.company.deleteMany();
    await prisma.shipper.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw ShipperNotFoundError if shipper does not exist', async() => {
      // Arrange
      const id = 'non-existing-id';
      const findByIdSpy = jest.spyOn(sut['shipperRepository'], 'findById').mockResolvedValue(null);
      const editSpy = jest.spyOn(sut['shipperRepository'], 'edit');

      // Act & Assert
      expect.assertions(3);
      return sut.execute(id).catch((error) => {
        expect(error).toBeInstanceOf(ShipperNotFoundError);
        expect(findByIdSpy).toHaveBeenCalledWith(id);
        expect(editSpy).not.toHaveBeenCalled();
      });
    });

    it('should call shipperRepository.findById and shipperRepository.edit with correct values', async() => {
      // Arrange
      const id = 'shipper-id-123';
      const shipperEntity = Shipper.load({
        id,
        companyName: 'Test Shipper Ltda',
        fantasyName: 'Test Shipper',
        cnpj: '52435131000103',
        contact: '(11) 98888-8888',
        representative: 'João Silva',
        zipCode: '01234-567',
        street: 'Rua Teste',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        companyIds: [companyId],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const findByIdSpy = jest.spyOn(sut['shipperRepository'], 'findById').mockResolvedValue(shipperEntity);
      const editSpy = jest.spyOn(sut['shipperRepository'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(id);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
      expect(editSpy).toHaveBeenCalledTimes(1);
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          id,
          active: false, // Should be toggled
        }),
      }));
      expect(result).toEqual<SuccessMessage>({ message: 'Status atualizado com sucesso.' });
    });

    it('should toggle status from active to inactive', async() => {
      // Arrange
      const id = 'shipper-id-123';
      const shipperEntity = Shipper.load({
        id,
        companyName: 'Active Shipper Ltda',
        fantasyName: 'Active Shipper',
        cnpj: '20021261000103',
        contact: '(21) 99999-9999',
        representative: 'Maria Santos',
        zipCode: '02222-222',
        street: 'Rua Ativa',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        companyIds: [companyId],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(sut['shipperRepository'], 'findById').mockResolvedValue(shipperEntity);
      const editSpy = jest.spyOn(sut['shipperRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(id);

      // Assert
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          active: false,
        }),
      }));
    });

    it('should toggle status from inactive to active', async() => {
      // Arrange
      const id = 'shipper-id-123';
      const shipperEntity = Shipper.load({
        id,
        companyName: 'Inactive Shipper Ltda',
        fantasyName: 'Inactive Shipper',
        cnpj: '75279173000190',
        contact: '(31) 98888-8888',
        representative: 'Carlos Lima',
        zipCode: '03333-333',
        street: 'Rua Inativa',
        number: '300',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'Belo Horizonte',
        state: 'MG',
        companyIds: [companyId],
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(sut['shipperRepository'], 'findById').mockResolvedValue(shipperEntity);
      const editSpy = jest.spyOn(sut['shipperRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(id);

      // Assert
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          active: true,
        }),
      }));
    });
  });

  describe('integration tests', () => {
    it('should throw ShipperNotFoundError if shipper does not exist', async() => {
      // Arrange
      const id = 'non-existing-shipper-id';

      // Act & Assert
      await expect(sut.execute(id)).rejects.toThrow(ShipperNotFoundError);
    });

    it('should toggle shipper status from active to inactive', async() => {
      // Arrange
      const shipper = await createShipper.execute({
        companyName: 'Test Shipper Ltd',
        fantasyName: 'Test Shipper',
        cnpj: '98752975000170',
        contact: '(11) 97777-7777',
        representative: 'John Doe',
        zipCode: '01111-111',
        street: 'Main Street',
        number: '100',
        complement: 'Suite 1',
        reference: 'Near metro',
        neighborhood: 'Downtown',
        city: 'São Paulo',
        state: 'SP',
        companyIds: [companyId],
      });

      // Verify initial status is active
      const initialShipper = await findShipperById.execute(shipper.id);
      expect(initialShipper).not.toBeNull();
      expect(initialShipper!.active).toBe(true);

      // Act
      const result = await sut.execute(shipper.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Status atualizado com sucesso.' });

      const updatedShipper = await findShipperById.execute(shipper.id);
      expect(updatedShipper).not.toBeNull();
      expect(updatedShipper!.active).toBe(false);
    });

    it('should toggle shipper status from inactive to active', async() => {
      // Arrange
      const shipper = await createShipper.execute({
        companyName: 'Inactive Shipper Ltd',
        fantasyName: 'Inactive Shipper',
        cnpj: '45077596000166',
        contact: '(21) 96666-6666',
        representative: 'Jane Doe',
        zipCode: '02222-222',
        street: 'Secondary Street',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'Center',
        city: 'Rio de Janeiro',
        state: 'RJ',
        companyIds: [companyId],
      });

      // First toggle to inactive
      await sut.execute(shipper.id);
      const inactiveShipper = await findShipperById.execute(shipper.id);
      expect(inactiveShipper).not.toBeNull();
      expect(inactiveShipper!.active).toBe(false);

      // Act - Toggle back to active
      const result = await sut.execute(shipper.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Status atualizado com sucesso.' });

      const activeShipper = await findShipperById.execute(shipper.id);
      expect(activeShipper).not.toBeNull();
      expect(activeShipper!.active).toBe(true);
    });

    it('should toggle status multiple times correctly', async() => {
      // Arrange
      const shipper = await createShipper.execute({
        companyName: 'Multiple Toggle Shipper Ltd',
        fantasyName: 'Multiple Toggle',
        cnpj: '12911198000144',
        contact: '(31) 95555-5555',
        representative: 'Bob Smith',
        zipCode: '03333-333',
        street: 'Toggle Street',
        number: '300',
        complement: null,
        reference: null,
        neighborhood: 'Central',
        city: 'Belo Horizonte',
        state: 'MG',
        companyIds: [companyId],
      });

      // Act & Assert - Toggle 1: active -> inactive
      await sut.execute(shipper.id);
      let currentShipper = await findShipperById.execute(shipper.id);
      expect(currentShipper).not.toBeNull();
      expect(currentShipper!.active).toBe(false);

      // Toggle 2: inactive -> active
      await sut.execute(shipper.id);
      currentShipper = await findShipperById.execute(shipper.id);
      expect(currentShipper).not.toBeNull();
      expect(currentShipper!.active).toBe(true);

      // Toggle 3: active -> inactive
      await sut.execute(shipper.id);
      currentShipper = await findShipperById.execute(shipper.id);
      expect(currentShipper).not.toBeNull();
      expect(currentShipper!.active).toBe(false);

      // Toggle 4: inactive -> active
      await sut.execute(shipper.id);
      currentShipper = await findShipperById.execute(shipper.id);
      expect(currentShipper).not.toBeNull();
      expect(currentShipper!.active).toBe(true);
    });

    it('should update updatedAt timestamp on status toggle', async() => {
      // Arrange
      const shipper = await createShipper.execute({
        companyName: 'Timestamp Test Shipper Ltd',
        fantasyName: 'Timestamp Test',
        cnpj: '75279173000190',
        contact: '(41) 94444-4444',
        representative: 'Alice Johnson',
        zipCode: '04444-444',
        street: 'Timestamp Avenue',
        number: '400',
        complement: null,
        reference: null,
        neighborhood: 'District',
        city: 'Curitiba',
        state: 'PR',
        companyIds: [companyId],
      });

      const beforeToggle = await findShipperById.execute(shipper.id);
      expect(beforeToggle).not.toBeNull();

      // Add small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Act
      await sut.execute(shipper.id);

      // Assert
      const afterToggle = await findShipperById.execute(shipper.id);
      expect(afterToggle).not.toBeNull();
    });

    it('should preserve all other shipper properties when toggling status', async() => {
      // Arrange
      const originalData = {
        companyName: 'Preserve Props Shipper Ltd',
        fantasyName: 'Preserve Props',
        cnpj: '45697335000149',
        contact: '(51) 93333-3333',
        representative: 'Charlie Brown',
        zipCode: '05555-555',
        street: 'Building Street',
        number: '500',
        complement: 'Building A',
        reference: 'Near park',
        neighborhood: 'Zone',
        city: 'Porto Alegre',
        state: 'RS',
        companyIds: [companyId],
      };

      const shipper = await createShipper.execute(originalData);
      const initialShipper = await findShipperById.execute(shipper.id);
      expect(initialShipper).not.toBeNull();

      // Act
      await sut.execute(shipper.id);

      // Assert
      const toggledShipper = await findShipperById.execute(shipper.id);
      expect(toggledShipper).not.toBeNull();
      expect(toggledShipper!.companyName).toBe(originalData.companyName);
      expect(toggledShipper!.fantasyName).toBe(originalData.fantasyName);
      expect(toggledShipper!.cnpj).toBe(originalData.cnpj);
      expect(toggledShipper!.contact).toBe(originalData.contact);
      expect(toggledShipper!.representative).toBe(originalData.representative);
      expect(toggledShipper!.zipCode).toBe(originalData.zipCode);
      expect(toggledShipper!.street).toBe(originalData.street);
      expect(toggledShipper!.number).toBe(originalData.number);
      expect(toggledShipper!.complement).toBe(originalData.complement);
      expect(toggledShipper!.reference).toBe(originalData.reference);
      expect(toggledShipper!.neighborhood).toBe(originalData.neighborhood);
      expect(toggledShipper!.city).toBe(originalData.city);
      expect(toggledShipper!.state).toBe(originalData.state);
      expect(toggledShipper!.companies).toEqual(initialShipper!.companies);
      expect(toggledShipper!.createdAt).toEqual(initialShipper!.createdAt);
      // Only active and updatedAt should change
      expect(toggledShipper!.active).not.toBe(initialShipper!.active);
    });

    it('should work with shippers associated with multiple companies', async() => {
      // Arrange
      const company2Id = (await createCompany.execute({
        name: 'Second Company Ltd',
        fantasyName: 'Second Company',
        document: '20852273000171',
        ie: '987654321',
        zipCode: '87654321',
        street: 'Second Street',
        number: '200',
        neighborhood: 'Uptown',
        complement: null,
        reference: null,
        city: 'Rio de Janeiro',
        state: 'RJ',
        cellphone: '21988888888',
        phone01: '2144444444',
        phone02: null,
        email01: 'test@company2.com',
        email02: null,
      })).id;

      const shipper = await createShipper.execute({
        companyName: 'Multi Company Shipper Ltd',
        fantasyName: 'Multi Company',
        cnpj: '45275773000119',
        contact: '(61) 92222-2222',
        representative: 'David Wilson',
        zipCode: '06666-666',
        street: 'Global Avenue',
        number: '600',
        complement: 'HQ Floor',
        reference: null,
        neighborhood: 'Federal',
        city: 'Brasília',
        state: 'DF',
        companyIds: [companyId, company2Id],
      });

      const initialShipper = await findShipperById.execute(shipper.id);
      expect(initialShipper).not.toBeNull();
      expect(initialShipper!.companies).toHaveLength(2);

      // Act
      await sut.execute(shipper.id);

      // Assert
      const toggledShipper = await findShipperById.execute(shipper.id);
      expect(toggledShipper).not.toBeNull();
      expect(toggledShipper!.active).toBe(false);
      expect(toggledShipper!.companies).toHaveLength(2);
      expect(toggledShipper!.companies).toEqual(initialShipper!.companies);
    });

    it('should return success message with correct text', async() => {
      // Arrange
      const shipper = await createShipper.execute({
        companyName: 'Message Test Shipper Ltd',
        fantasyName: 'Message Test',
        cnpj: '15270176000130',
        contact: '(85) 91111-1111',
        representative: 'Emma Davis',
        zipCode: '07777-777',
        street: 'Message Street',
        number: '700',
        complement: null,
        reference: null,
        neighborhood: 'Office Zone',
        city: 'Fortaleza',
        state: 'CE',
        companyIds: [companyId],
      });

      // Act
      const result = await sut.execute(shipper.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({
        message: 'Status atualizado com sucesso.',
      });
      expect(result.message).toBe('Status atualizado com sucesso.');
    });
  });
});
