import { Test, TestingModule } from '@nestjs/testing';
import { AddressModule } from 'src/app/address/address.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateAddress } from '../create-address/create-address.service';
import { CreateAddressInputDto } from '../create-address/dtos/create-address.dto';
import { FindAllAddress } from './find-all-address.service';

describe('FindAllAddress', () => {
  let sut: FindAllAddress;
  let prisma: PrismaService;
  let createAddress: CreateAddress;

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

    await prisma.address.deleteMany();
  });

  afterAll(async() => {
    await prisma.address.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should find all addresses by owner id and is main', async() => {
    const data: CreateAddressInputDto = {
      zipCode: '12345-678',
      street: 'Main St',
      number: '123',
      complement: 'Apt 4',
      neighborhood: 'Downtown',
      city: 'Metropolis',
      state: 'State',
      ownerId: 'owner-1',
    };

    await createAddress.execute({ ...data }, true);
    await createAddress.execute({ ...data }, false);
    await createAddress.execute({ ...data, ownerId: 'owner-2' }, true);

    const addressesMain = await sut.execute({ ownerId: 'owner-1', isMain: true });
    expect(addressesMain.data).toHaveLength(1);
    expect(addressesMain.data[0].isMain).toBe(true);
    expect(addressesMain.data[0].ownerId).toBe('owner-1');
  });
});
