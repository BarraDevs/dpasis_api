import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { BankDto } from 'src/app/global/bank/application/dtos/bank.dto';
import { CreateBankInputDto } from 'src/app/global/bank/application/usecases/create-bank/dtos/create-bank.dto';
import { EditBankInputDto } from 'src/app/global/bank/application/usecases/edit-bank/dtos/edit-bank.dto';
import { FindAllBankQueryDto } from 'src/app/global/bank/application/usecases/find-all-bank/dtos/find-all-bank.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BankDaoAdapterPrisma } from './bank-prisma.dao';

describe('BankDaoAdapterPrisma - Integration tests', () => {
  let sut: BankDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [BankDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(BankDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  const baseBankData = {
    drawer: 'Empresa XYZ',
    wallet: '123',
    account: '12345-6',
    agency: '0001',
    bankCode: '001',
    bankName: 'Banco do Brasil',
    paymentLocation: null as string | null,
    active: true,
  };

  describe('findAll', () => {
    it('should return empty array when no banks exist', async() => {
      // Arrange
      const query: FindAllBankQueryDto = {};

      // Act
      const [banks, total] = await sut.findAll(query);

      // Assert
      expect(banks).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all banks with default pagination', async() => {
      // Arrange
      await prisma.bank.createMany({
        data: [
          { ...baseBankData, bankCode: '001', bankName: 'Banco do Brasil' },
          { ...baseBankData, bankCode: '033', bankName: 'Santander', agency: '0002', account: '65432-1' },
        ],
      });
      const query: FindAllBankQueryDto = {};

      // Act
      const [banks, total] = await sut.findAll(query);

      // Assert
      expect(banks).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      // Arrange
      await prisma.bank.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          ...baseBankData,
          bankCode: String(i + 1).padStart(3, '0'),
          agency: String(i + 1).padStart(4, '0'),
          account: `${10000 + i}-${i}`,
        })),
      });

      // Act
      const [banks, total] = await sut.findAll({ page: 1, size: 10 });
      const [banks2, total2] = await sut.findAll({ page: 3, size: 10 });

      // Assert
      expect(banks).toHaveLength(10);
      expect(total).toBe(25);
      expect(banks2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should search in drawer, bankName and bankCode (case-insensitive)', async() => {
      // Arrange
      await prisma.bank.createMany({
        data: [
          { ...baseBankData, drawer: 'Empresa ABC', bankName: 'Banco do Brasil' },
          { ...baseBankData, bankCode: '033', bankName: 'Santander', agency: '0002', account: '65432-1' },
        ],
      });
      const query: FindAllBankQueryDto = { search: 'santander' };

      // Act
      const [banks, total] = await sut.findAll(query);

      // Assert
      expect(banks).toHaveLength(1);
      expect(total).toBe(1);
      expect(banks[0].bankName).toBe('Santander');
    });

    it('should return results ordered by bankName asc', async() => {
      // Arrange
      const b2 = await prisma.bank.create({
        data: { ...baseBankData, bankName: 'Banco B', agency: '0002', account: '22222-2' },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const b1 = await prisma.bank.create({
        data: { ...baseBankData, bankName: 'Banco A', agency: '0001', account: '11111-1' },
      });
      const query: FindAllBankQueryDto = {};

      // Act
      const [banks] = await sut.findAll(query);

      // Assert
      expect(banks).toHaveLength(2);
      expect(banks[0].bankName).toBe(b1.bankName);
      expect(banks[1].bankName).toBe(b2.bankName);
    });

    it('should filter by active when provided', async() => {
      // Arrange
      await prisma.bank.createMany({
        data: [
          { ...baseBankData, bankName: 'Banco Ativo', agency: '0001', account: '11111-1', active: true },
          { ...baseBankData, bankName: 'Banco Inativo', agency: '0002', account: '22222-2', active: false },
        ],
      });
      const queryActive: FindAllBankQueryDto = { active: true };
      const queryInactive: FindAllBankQueryDto = { active: false };

      // Act
      const [banksActive, totalActive] = await sut.findAll(queryActive);
      const [banksInactive, totalInactive] = await sut.findAll(queryInactive);

      // Assert
      expect(banksActive).toHaveLength(1);
      expect(totalActive).toBe(1);
      expect(banksActive[0].active).toBe(true);
      expect(banksInactive).toHaveLength(1);
      expect(totalInactive).toBe(1);
      expect(banksInactive[0].active).toBe(false);
    });

    it('should return all bank fields correctly', async() => {
      // Arrange
      const created = await prisma.bank.create({
        data: {
          ...baseBankData,
          paymentLocation: 'Pagável em qualquer banco',
        },
      });
      const query: FindAllBankQueryDto = {};

      // Act
      const [banks] = await sut.findAll(query);

      // Assert
      expect(banks).toHaveLength(1);
      expect(banks[0]).toEqual<BankDto>({
        id: created.id,
        drawer: created.drawer,
        wallet: created.wallet,
        account: created.account,
        agency: created.agency,
        bankCode: created.bankCode,
        bankName: created.bankName,
        paymentLocation: created.paymentLocation,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when bank does not exist', async() => {
      // Arrange
      const id = 0;

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return bank by id', async() => {
      // Arrange
      const created = await prisma.bank.create({
        data: baseBankData,
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.bankCode).toBe('001');
      expect(result?.bankName).toBe('Banco do Brasil');
      expect(result?.active).toBe(true);
    });
  });

  describe('findByBankCodeAgencyAccount', () => {
    it('should return null when bank does not exist', async() => {
      // Arrange
      await prisma.bank.create({
        data: baseBankData,
      });

      // Act
      const result = await sut.findByBankCodeAgencyAccount('033', '0002', '65432-1');

      // Assert
      expect(result).toBeNull();
    });

    it('should return bank by bankCode, agency and account', async() => {
      // Arrange
      const created = await prisma.bank.create({
        data: baseBankData,
      });

      // Act
      const result = await sut.findByBankCodeAgencyAccount(
        created.bankCode,
        created.agency,
        created.account,
      );

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.bankCode).toBe(created.bankCode);
      expect(result?.active).toBe(created.active);
    });

    it('should find bank (case-insensitive)', async() => {
      // Arrange
      const created = await prisma.bank.create({
        data: baseBankData,
      });

      // Act
      const result = await sut.findByBankCodeAgencyAccount('001', '0001', '12345-6');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.bankCode).toBe(created.bankCode);
    });
  });

  describe('save', () => {
    it('should create bank and return id', async() => {
      // Arrange
      const data: CreateBankInputDto = {
        drawer: 'Empresa XYZ',
        wallet: '123',
        account: '12345-6',
        agency: '0001',
        bankCode: '001',
        bankName: 'Banco do Brasil',
        paymentLocation: null,
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.bank.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.drawer).toBe(data.drawer);
      expect(saved?.wallet).toBe(data.wallet);
      expect(saved?.account).toBe(data.account);
      expect(saved?.agency).toBe(data.agency);
      expect(saved?.bankCode).toBe(data.bankCode);
      expect(saved?.bankName).toBe(data.bankName);
      expect(saved?.paymentLocation).toBeNull();
      expect(saved?.active).toBe(true);
    });

    it('should create bank with optional paymentLocation', async() => {
      // Arrange
      const data: CreateBankInputDto = {
        ...baseBankData,
        paymentLocation: 'Pagável em qualquer banco até o vencimento',
      };

      // Act
      const id = await sut.save(data);

      // Assert
      const saved = await prisma.bank.findUnique({ where: { id } });
      expect(saved?.paymentLocation).toBe(data.paymentLocation);
    });
  });

  describe('edit', () => {
    it('should update bank fields', async() => {
      // Arrange
      const bank = await prisma.bank.create({
        data: baseBankData,
      });
      const data: EditBankInputDto = {
        drawer: 'Nova Empresa',
        wallet: '456',
        account: '54321-0',
        agency: '0002',
        bankCode: '033',
        bankName: 'Santander',
        paymentLocation: null,
      };

      // Act
      await sut.edit(bank.id, data);

      // Assert
      const updated = await prisma.bank.findUnique({ where: { id: bank.id } });
      expect(updated?.drawer).toBe('Nova Empresa');
      expect(updated?.wallet).toBe('456');
      expect(updated?.account).toBe('54321-0');
      expect(updated?.agency).toBe('0002');
      expect(updated?.bankCode).toBe('033');
      expect(updated?.bankName).toBe('Santander');
      expect(updated?.active).toBe(true);
    });
  });

  describe('updateStatus', () => {
    it('should update bank status', async() => {
      // Arrange
      const bank = await prisma.bank.create({
        data: baseBankData,
      });

      // Act
      await sut.updateStatus(bank.id, false);

      // Assert
      const updated = await prisma.bank.findUnique({ where: { id: bank.id } });
      expect(updated?.active).toBe(false);

      // Act (again)
      await sut.updateStatus(bank.id, true);

      // Assert (again)
      const updated2 = await prisma.bank.findUnique({ where: { id: bank.id } });
      expect(updated2?.active).toBe(true);
    });
  });

  describe('delete', () => {
    it('should remove bank', async() => {
      const bank = await prisma.bank.create({
        data: { ...baseBankData, bankCode: `Z${Date.now()}`.slice(0, 20), account: `Q${Date.now()}`.slice(0, 20) },
      });

      await sut.delete(bank.id);

      expect(await prisma.bank.findUnique({ where: { id: bank.id } })).toBeNull();
    });
  });

  describe('countClientInvoiceConfigsByBankId', () => {
    it('should return 0 when bank has no invoice configs', async() => {
      const bank = await prisma.bank.create({
        data: { ...baseBankData, bankCode: `C${Date.now()}`.slice(0, 20), account: `A${Date.now()}`.slice(0, 20) },
      });

      const count = await sut.countClientInvoiceConfigsByBankId(bank.id);

      expect(count).toBe(0);
    });

    it('should return count of client invoice configs referencing this bank', async() => {
      const suffix = `${Date.now()}`;
      const bank = await prisma.bank.create({
        data: {
          drawer: 'D',
          wallet: '1',
          account: `I${suffix}`.slice(0, 20),
          agency: '0001',
          bankCode: `K${suffix}`.slice(0, 20),
          bankName: 'Bank',
          paymentLocation: null,
          active: true,
        },
      });

      const [group, owner] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `G${suffix}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `O${suffix}`, active: true } }),
      ]);

      const client = await prisma.client.create({
        data: {
          type: ClientType.PJ,
          document: String(Date.now()).padStart(14, '0').slice(-14),
          ie: null,
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Co',
          fantasyName: null,
          headquarters: 'SP',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const address = await prisma.clientAddress.create({
        data: {
          clientId: client.id,
          type: ClientAddressType.BILLING,
          zipCode: '12345-678',
          street: 'Rua',
          number: '1',
          complement: null,
          neighborhood: 'C',
          city: 'SP',
          state: 'SP',
          active: true,
        },
      });

      await prisma.clientInvoiceConfig.create({
        data: {
          clientId: client.id,
          generateNf: true,
          type: ClientInvoiceConfigType.MONTHLY,
          emissionDay: 5,
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 15,
          deadlineDays: null,
          months: [],
          billingAddressId: address.id,
          bankId: bank.id,
          autoProtestBoleto: false,
          message: null,
        },
      });

      const count = await sut.countClientInvoiceConfigsByBankId(bank.id);

      expect(count).toBe(1);
    });
  });
});
