import { Test } from '@nestjs/testing';
import { ShipperPersistenceModule } from 'src/app/shipper/application/persistence/shipper-persistence.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ShipperDaoAdapterPrisma } from './shipper.dao';

describe('ShipperDaoAdapterPrisma', () => {
  let sut: ShipperDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ShipperPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ShipperDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ShipperDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.shipper.deleteMany();
  });

  afterEach(async() => {
    await prisma.shipper.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
