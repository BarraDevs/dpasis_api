import { Test } from '@nestjs/testing';
import { BankModule } from '../../../bank.module';
import { BankNotFoundError } from '../../../domain/errors/bank-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { buildTestTlsMaterial } from 'src/test/fixtures/test-certificate';
import { UploadBankCertificate } from './upload-bank-certificate.service';

describe('UploadBankCertificate - Integration tests', () => {
  let sut: UploadBankCertificate;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({ imports: [BankModule] }).compile();
    sut = module.get(UploadBankCertificate);
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

  it('should throw BankNotFoundError when bank does not exist', async() => {
    const material = buildTestTlsMaterial();
    await expect(sut.execute(99999, {
      cert: [{ buffer: Buffer.from(material.certPem), size: 10 } as Express.Multer.File],
      key: [{ buffer: Buffer.from(material.keyPem), size: 10 } as Express.Multer.File],
    }, {})).rejects.toThrow(BankNotFoundError);
  });

  it('should store PEM pair metadata on the bank', async() => {
    // Arrange
    const bank = await prisma.bank.create({
      data: {
        drawer: 'Drawer',
        wallet: '1',
        account: `A${Date.now()}`.slice(0, 20),
        agency: '0001',
        bankCode: `B${Date.now()}`.slice(0, 20),
        bankName: 'Inter',
        paymentLocation: null,
        active: true,
      },
    });
    const material = buildTestTlsMaterial();

    // Act
    const result = await sut.execute(bank.id, {
      cert: [{
        buffer: Buffer.from(material.certPem),
        size: material.certPem.length,
      } as Express.Multer.File],
      key: [{
        buffer: Buffer.from(material.keyPem),
        size: material.keyPem.length,
      } as Express.Multer.File],
    }, {});

    // Assert
    expect(result).toEqual({ message: 'Certificado do banco atualizado com sucesso' });
    const saved = await prisma.bank.findUnique({ where: { id: bank.id } });
    expect(saved?.certFormat).toBe('PEM_PAIR');
    expect(saved?.certFilePath).toBe(`${bank.id}/cert.enc`);
    expect(saved?.keyFilePath).toBe(`${bank.id}/key.enc`);
    expect(saved?.certificateNotAfter).toBeInstanceOf(Date);
  });
});
