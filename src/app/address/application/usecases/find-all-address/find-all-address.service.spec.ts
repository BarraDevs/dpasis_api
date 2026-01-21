import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Owner } from '@prisma/client';
import { AddressModule } from 'src/app/address/address.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { AddressDto } from '../../dtos/address.dto';
import { CreateAddress } from '../create-address/create-address.service';
import { CreateAddressInputDto } from '../create-address/dtos/create-address.dto';
import { FindAllAddressQueryDto } from './dtos/find-all-address.dto';
import { FindAllAddress } from './find-all-address.service';

describe('FindAllAddress', () => {
  let sut: FindAllAddress;
  let prisma: PrismaService;
  let createAddress: CreateAddress;
  let data: CreateAddressInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AddressModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllAddress);
    prisma = module.get(PrismaService);
    createAddress = module.get(CreateAddress);

    data = {
      zipCode: '12345-678',
      street: 'Main St',
      number: '123',
      complement: 'Apt 4',
      neighborhood: 'Downtown',
      city: 'Metropolis',
      state: 'State',
      ownerId: 'owner-1',
      nickname: null,
      reference: null,
    };

    await prisma.owner.deleteMany();
    await prisma.address.deleteMany();
  });

  afterEach(async() => {
    await prisma.owner.deleteMany();
    await prisma.address.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call addressDao.findAll with correct values', async() => {
      // Arrange
      const queries = createMock<FindAllAddressQueryDto>({ page: 1, size: 10 });
      const findAllSpy = jest.spyOn(sut['addressDao'], 'findAll').mockResolvedValue([[], 0]);

      // Act
      await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('integration tests', () => {
    let owner01: Owner;
    let owner02: Owner;

    beforeEach(async() => {
      owner01 = await prisma.owner.create({
        data: {
          id: 'owner-1',
          active: true,
        },
      });
      owner02 = await prisma.owner.create({
        data: {
          id: 'owner-2',
          active: true,
        },
      });
    });

    it('should return an empty array when no addresses exist', async() => {
      // Act
      const result = await sut.execute({ ownerId: 'non-existent-owner', isMain: true });

      // Assert
      expect(result).toEqual<IPagination<AddressDto>>({
        data: [],
        currentPage: 1,
        itemsPerPage: 0,
        totalItems: 0,
        totalPages: 0,
      });
    });

    it('should filter addresses by isMain flag', async() => {
      // Arrange
      const isMain = false;

      const address01 = await createAddress.execute({ ...data, ownerId: owner01.id }, isMain);
      await createAddress.execute({ ...data, ownerId: owner01.id }, !isMain);

      // Act
      const result = await sut.execute({ ownerId: owner01.id, isMain });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: address01.id }),
        ]),
      );
    });

    it('should filter addresses by ownerId', async() => {
      // Arrange
      const isMain = false;

      const address01 = await createAddress.execute({ ...data, ownerId: owner01.id }, isMain);
      const address02 = await createAddress.execute({ ...data, ownerId: owner01.id }, isMain);
      await createAddress.execute({ ...data, ownerId: owner02.id }, isMain);

      // Act
      const result = await sut.execute({ ownerId: owner01.id, isMain });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: address01.id }),
          expect.objectContaining({ id: address02.id }),
        ]),
      );
    });

    it('should filter addresses by ownerId and isMain flag', async() => {
      // Arrange
      const address01 = await createAddress.execute({ ...data, ownerId: owner01.id }, true);
      await createAddress.execute({ ...data, ownerId: owner01.id }, false);
      await createAddress.execute({ ...data, ownerId: owner02.id }, true);

      // Act
      const result = await sut.execute({ ownerId: owner01.id, isMain: true });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: address01.id }),
        ]),
      );
    });

    it('should return paginated addresses', async() => {
      // Arrange
      const addresses = [];
      for (let i = 0; i < 15; i++) {
        const address = await createAddress.execute({ ...data, ownerId: owner01.id }, false);
        addresses.push(address);
      }

      // Act
      const resultPage1 = await sut.execute({ ownerId: owner01.id, isMain: false, page: 1, size: 10 });
      const resultPage2 = await sut.execute({ ownerId: owner01.id, isMain: false, page: 2, size: 10 });

      // Assert
      expect(resultPage1.data).toHaveLength(10);
      expect(resultPage1.totalItems).toBe(15);
      expect(resultPage1.totalPages).toBe(2);

      expect(resultPage2.data).toHaveLength(5);
      expect(resultPage2.totalItems).toBe(15);
      expect(resultPage2.totalPages).toBe(2);
    });
  });
});
