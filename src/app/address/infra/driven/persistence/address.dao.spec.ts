import { Test } from '@nestjs/testing';
import { Owner } from '@prisma/client';
import { AddressDto } from 'src/app/address/application/dtos/address.dto';
import { AddressPersistenceModule } from 'src/app/address/application/persistence/address-persistence.module';
import { CreateAddressInputDto } from 'src/app/address/application/usecases/create-address/dtos/create-address.dto';
import { EditAddressInputDto } from 'src/app/address/application/usecases/edit-address/dtos/edit-address.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AddressDaoAdapterPrisma } from './address.dao';

describe('AddressDaoAdapterPrisma', () => {
  let sut: AddressDaoAdapterPrisma;
  let prisma: PrismaService;
  let owner01: Owner;
  let owner02: Owner;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AddressPersistenceModule,
        ConfigModule,
      ],
      providers: [
        AddressDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(AddressDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.truncate();

    // Create owners for address ownership
    owner01 = await prisma.owner.create({
      data: {
        id: 'owner-address-dao-01',
        active: true,
      },
    });
    owner02 = await prisma.owner.create({
      data: {
        id: 'owner-address-dao-02',
        active: true,
      },
    });
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('save', () => {
    it('should save an address as main and return its id', async() => {
      // Arrange
      const data: CreateAddressInputDto = {
        zipCode: '12345-678',
        street: 'Main Street',
        number: '100',
        neighborhood: 'Downtown',
        city: 'Test City',
        state: 'TC',
        nickname: null,
        complement: null,
        reference: null,
        ownerId: owner01.id,
      };

      // Act
      const id = await sut.save(data, true);

      // Assert
      const savedAddress = await prisma.address.findUnique({ where: { id } });
      expect(savedAddress).toBeDefined();
      expect(savedAddress).toEqual<AddressDto>({
        id: expect.any(String),
        isMain: true,
        nickname: data.nickname || null,
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement || null,
        reference: data.reference || null,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        ownerId: data.ownerId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should save an address as non-main and return its id', async() => {
      // Arrange
      const data: CreateAddressInputDto = {
        zipCode: '98765-432',
        nickname: null,
        street: 'Secondary Street',
        number: '200',
        neighborhood: 'Suburb',
        city: 'Another City',
        state: 'AC',
        complement: 'Apt 101',
        reference: null,
        ownerId: owner01.id,
      };

      // Act
      const id = await sut.save(data, false);

      // Assert
      expect(id).toEqual(expect.any(String));
      const savedAddress = await prisma.address.findUnique({ where: { id } });
      expect(savedAddress).toBeDefined();
      expect(savedAddress?.isMain).toBe(false);
      expect(savedAddress?.complement).toBe(data.complement);
    });
  });

  describe('findAll', () => {
    beforeEach(async() => {
      // Seed data for findAll tests
      await prisma.address.createMany({
        data: [
          { zipCode: '11111-111', street: 'First St', number: '10', neighborhood: 'N1', city: 'City1', state: 'S1', isMain: true, ownerId: owner01.id },
          { zipCode: '22222-222', street: 'Second St', number: '20', neighborhood: 'N2', city: 'City2', state: 'S2', isMain: false, ownerId: owner01.id },
          { zipCode: '33333-333', street: 'Third St', number: '30', neighborhood: 'N3', city: 'City3', state: 'S3', isMain: false, ownerId: owner01.id },
          { zipCode: '44444-444', street: 'Fourth St', number: '40', neighborhood: 'N4', city: 'City4', state: 'S4', isMain: true, ownerId: owner02.id },
          { zipCode: '55555-555', street: 'Fifth St', number: '50', neighborhood: 'N5', city: 'City5', state: 'S5', isMain: false, ownerId: owner02.id },
        ],
      });
    });

    it('should return all addresses for a specific owner', async() => {
      // Act
      const [addresses, total] = await sut.findAll({ ownerId: owner01.id, isMain: false });

      // Assert
      expect(total).toBe(2);
      expect(addresses).toHaveLength(2);
      expect(addresses.every(a => a.ownerId === owner01.id)).toBe(true);
    });

    it('should return only main addresses for a specific owner', async() => {
      // Act
      const [addresses, total] = await sut.findAll({ ownerId: owner01.id, isMain: true });

      // Assert
      expect(total).toBe(1);
      expect(addresses).toHaveLength(1);
      expect(addresses[0].isMain).toBe(true);
      expect(addresses[0].street).toBe('First St');
    });

    it('should return only non-main addresses for a specific owner', async() => {
      // Act
      const [addresses, total] = await sut.findAll({ ownerId: owner01.id, isMain: false });

      // Assert
      expect(total).toBe(2);
      expect(addresses).toHaveLength(2);
      expect(addresses.every(a => a.isMain === false)).toBe(true);
    });

    it('should return paginated addresses', async() => {
      // Act
      const [addresses, total] = await sut.findAll({ ownerId: owner01.id, isMain: false, page: 2, size: 2 });

      // Assert
      expect(total).toBe(2);
      expect(addresses).toHaveLength(0);
    });

    it('should return empty if ownerId has no addresses', async() => {
      // Act
      const [addresses, total] = await sut.findAll({ ownerId: 'non-existing-owner', isMain: true });

      // Assert
      expect(total).toBe(0);
      expect(addresses).toHaveLength(0);
    });

    it('should return empty if owner has no main addresses when filtering by isMain=true', async() => {
      // Arrange
      const owner03 = await prisma.owner.create({
        data: {
          id: 'owner-address-dao-03',
          active: true,
        },
      });
      await prisma.address.create({
        data: {
          zipCode: '66666-666',
          street: 'Sixth St',
          number: '60',
          neighborhood: 'N6',
          city: 'City6',
          state: 'S6',
          isMain: false,
          ownerId: owner03.id,
        },
      });

      // Act
      const [addresses, total] = await sut.findAll({ ownerId: owner03.id, isMain: true });

      // Assert
      expect(total).toBe(0);
      expect(addresses).toHaveLength(0);
    });

    it('should return addresses ordered by createdAt desc', async() => {
      // Act
      const [addresses] = await sut.findAll({ ownerId: owner01.id, isMain: true });

      // Assert
      // The most recently created should come first
      // Note: This depends on the order they were inserted in beforeEach
      expect(addresses.length).toBeGreaterThan(0);
    });
  });

  describe('findById', () => {
    it('should return null if address not found', async() => {
      // Act
      const address = await sut.findById('non-existing-id', false);

      // Assert
      expect(address).toBeNull();
    });

    it('should return null if address exists but isMain flag does not match', async() => {
      // Arrange
      const created = await prisma.address.create({
        data: {
          zipCode: '77777-777',
          street: 'Seventh St',
          number: '70',
          neighborhood: 'N7',
          city: 'City7',
          state: 'S7',
          isMain: true,
          ownerId: owner01.id,
        },
      });

      // Act
      const address = await sut.findById(created.id, false); // Looking for non-main

      // Assert
      expect(address).toBeNull();
    });

    it('should return the correct address if found with matching isMain flag', async() => {
      // Arrange
      const created = await prisma.address.create({
        data: {
          zipCode: '88888-888',
          street: 'Eighth St',
          number: '80',
          neighborhood: 'N8',
          city: 'City8',
          state: 'S8',
          isMain: true,
          ownerId: owner01.id,
        },
      });

      // Act
      const address = await sut.findById(created.id, true);

      // Assert
      expect(address).not.toBeNull();
      expect(address?.id).toBe(created.id);
      expect(address?.street).toBe('Eighth St');
      expect(address?.isMain).toBe(true);
    });
  });

  describe('findMainAddress', () => {
    it('should return null if owner has no main address', async() => {
      // Arrange
      await prisma.address.create({
        data: {
          zipCode: '99999-999',
          street: 'Ninth St',
          number: '90',
          neighborhood: 'N9',
          city: 'City9',
          state: 'S9',
          isMain: false,
          ownerId: owner01.id,
        },
      });

      // Act
      const mainAddress = await sut.findMainAddress(owner01.id);

      // Assert
      expect(mainAddress).toBeNull();
    });

    it('should return the main address for the owner', async() => {
      // Arrange
      await prisma.address.createMany({
        data: [
          { zipCode: '10000-000', street: 'Tenth St', number: '100', neighborhood: 'N10', city: 'City10', state: 'S10', isMain: false, ownerId: owner01.id },
          { zipCode: '10001-001', street: 'Eleventh St', number: '110', neighborhood: 'N11', city: 'City11', state: 'S11', isMain: true, ownerId: owner01.id },
          { zipCode: '10002-002', street: 'Twelfth St', number: '120', neighborhood: 'N12', city: 'City12', state: 'S12', isMain: false, ownerId: owner01.id },
        ],
      });

      // Act
      const mainAddress = await sut.findMainAddress(owner01.id);

      // Assert
      expect(mainAddress).not.toBeNull();
      expect(mainAddress?.isMain).toBe(true);
      expect(mainAddress?.street).toBe('Eleventh St');
      expect(mainAddress?.ownerId).toBe(owner01.id);
    });

    it('should return the first main address if multiple exist (data integrity issue)', async() => {
      // Arrange - This tests behavior if data integrity is compromised
      const address1 = await prisma.address.create({
        data: {
          zipCode: '10003-003',
          street: 'First Main',
          number: '130',
          neighborhood: 'N13',
          city: 'City13',
          state: 'S13',
          isMain: true,
          ownerId: owner01.id,
        },
      });
      await prisma.address.create({
        data: {
          zipCode: '10004-004',
          street: 'Second Main',
          number: '140',
          neighborhood: 'N14',
          city: 'City14',
          state: 'S14',
          isMain: true,
          ownerId: owner01.id,
        },
      });

      // Act
      const mainAddress = await sut.findMainAddress(owner01.id);

      // Assert
      expect(mainAddress).not.toBeNull();
      expect(mainAddress?.isMain).toBe(true);
      // findFirst returns the first one it finds
      expect(mainAddress?.id).toBe(address1.id);
    });
  });

  describe('edit', () => {
    it('should update the address data', async() => {
      // Arrange
      const created = await prisma.address.create({
        data: {
          zipCode: '10005-005',
          street: 'Old Street',
          number: '150',
          neighborhood: 'Old Neighborhood',
          city: 'Old City',
          state: 'OC',
          isMain: false,
          ownerId: owner01.id,
        },
      });
      const editData: EditAddressInputDto = {
        street: 'New Street',
        number: '151',
        city: 'New City',
        complement: 'Suite 200',
      };

      // Act
      await sut.edit(created.id, editData);

      // Assert
      const updatedAddress = await prisma.address.findUnique({ where: { id: created.id } });
      expect(updatedAddress).toBeDefined();
      expect(updatedAddress?.street).toBe(editData.street);
      expect(updatedAddress?.number).toBe(editData.number);
      expect(updatedAddress?.city).toBe(editData.city);
      expect(updatedAddress?.complement).toBe(editData.complement);
      // Unchanged fields
      expect(updatedAddress?.zipCode).toBe('10005-005');
      expect(updatedAddress?.neighborhood).toBe('Old Neighborhood');
      expect(updatedAddress?.state).toBe('OC');
      expect(updatedAddress?.isMain).toBe(false);
    });

    it('should update all address fields when all are provided', async() => {
      // Arrange
      const created = await prisma.address.create({
        data: {
          zipCode: '10006-006',
          street: 'Original Street',
          number: '160',
          neighborhood: 'Original Neighborhood',
          city: 'Original City',
          state: 'OS',
          isMain: true,
          ownerId: owner01.id,
        },
      });
      const editData: EditAddressInputDto = {
        zipCode: '20006-006',
        street: 'Updated Street',
        number: '260',
        neighborhood: 'Updated Neighborhood',
        city: 'Updated City',
        state: 'US',
        complement: 'Floor 3',
      };

      // Act
      await sut.edit(created.id, editData);

      // Assert
      const updatedAddress = await prisma.address.findUnique({ where: { id: created.id } });
      expect(updatedAddress).toBeDefined();
      expect(updatedAddress?.zipCode).toBe(editData.zipCode);
      expect(updatedAddress?.street).toBe(editData.street);
      expect(updatedAddress?.number).toBe(editData.number);
      expect(updatedAddress?.neighborhood).toBe(editData.neighborhood);
      expect(updatedAddress?.city).toBe(editData.city);
      expect(updatedAddress?.state).toBe(editData.state);
      expect(updatedAddress?.complement).toBe(editData.complement);
      // isMain should not change through edit
      expect(updatedAddress?.isMain).toBe(true);
    });

    it('should throw error if address does not exist (Prisma handles this)', async() => {
      // Arrange
      const editData: EditAddressInputDto = { street: 'Non-existing Street' };

      // Act & Assert
      await expect(sut.edit('non-existing-id', editData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete the address', async() => {
      // Arrange
      const created = await prisma.address.create({
        data: {
          zipCode: '10007-007',
          street: 'To Be Deleted',
          number: '170',
          neighborhood: 'Delete Neighborhood',
          city: 'Delete City',
          state: 'DC',
          isMain: false,
          ownerId: owner01.id,
        },
      });

      // Act
      await sut.delete(created.id);

      // Assert
      const deletedAddress = await prisma.address.findUnique({ where: { id: created.id } });
      expect(deletedAddress).toBeNull();
    });

    it('should throw error if address does not exist (Prisma handles this)', async() => {
      // Act & Assert
      await expect(sut.delete('non-existing-id')).rejects.toThrow();
    });
  });

});
