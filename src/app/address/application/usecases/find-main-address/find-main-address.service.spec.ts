import { Test, TestingModule } from '@nestjs/testing';
import { AddressModule } from 'src/app/address/address.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AddressDto } from '../../dtos/address.dto';
import { CreateAddress } from '../create-address/create-address.service';
import { CreateAddressInputDto } from '../create-address/dtos/create-address.dto';
import { FindMainAddress } from './find-main-address.service';

describe('FindMainAddress', () => {
  let sut: FindMainAddress;
  let prisma: PrismaService;
  let createAddress: CreateAddress;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AddressModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindMainAddress);
    prisma = module.get(PrismaService);
    createAddress = module.get(CreateAddress);

    await prisma.address.deleteMany();
  });

  afterAll(async() => {
    await prisma.address.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return null if main address not found', async() => {
    const result = await sut.execute('non-existing-id');

    expect(result).toBeNull();
  });

  it('should return null if user has no main address', async() => {
    const ownerId = 'owner-1';
    await createAddress.execute({
      zipCode: '12345-678',
      street: 'Main St',
      number: '123',
      complement: 'Apt 4',
      neighborhood: 'Downtown',
      city: 'Metropolis',
      state: 'State',
      ownerId,
    }, false);

    const result = await sut.execute(ownerId);

    expect(result).toBeNull();
  });

  it('should return the main address for the given owner ID', async() => {
    const ownerId = 'owner-2';
    const mainAddressData: CreateAddressInputDto = {
      zipCode: '98765-432',
      street: 'Second St',
      number: '456',
      complement: 'Suite 8',
      neighborhood: 'Uptown',
      city: 'Gotham',
      state: 'State',
      ownerId,
    };

    const mainAddress = await createAddress.execute(mainAddressData, true);

    // Create a non-main address
    await createAddress.execute({
      zipCode: '55555-555',
      street: 'Third St',
      number: '789',
      complement: 'Apt 12',
      neighborhood: 'Midtown',
      city: 'Metropolis',
      state: 'State',
      ownerId,
    }, false);
    const result = await sut.execute(ownerId);

    expect(result).toBeDefined();
    expect(result).toEqual<AddressDto>({
      id: mainAddress.id,
      nickname: mainAddressData.nickname || null,
      zipCode: mainAddressData.zipCode,
      street: mainAddressData.street,
      number: mainAddressData.number,
      complement: mainAddressData.complement || null,
      reference: mainAddressData.reference || null,
      neighborhood: mainAddressData.neighborhood,
      city: mainAddressData.city,
      state: mainAddressData.state,
      ownerId: mainAddressData.ownerId,
      isMain: true,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});
