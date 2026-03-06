import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { InvalidDocumentError } from 'src/shared/value-objects/document/document.error';
import { CompanyModule } from '../../../company.module';
import { CreateCompany } from './create-company.service';
import { CreateCompanyInputDto } from './dtos/create-company.dto';

describe('CreateCompany - Integration tests', () => {
  let sut: CreateCompany;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CompanyModule],
    }).compile();

    sut = module.get(CreateCompany);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  function makeValidInput(overrides: Partial<CreateCompanyInputDto> = {}): CreateCompanyInputDto {
    return {
      name: 'Empresa LTDA',
      fantasyName: 'Empresa',
      document: '09.748.165/0001-10',
      ie: null,
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '1000',
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      phone01: '1133334444',
      phone02: null,
      cellphone: null,
      email01: 'contato@empresa.com',
      email02: null,
      ...overrides,
    };
  }

  describe('success path', () => {
    it('should create company and persist in database', async() => {
      const input = makeValidInput();

      const result = await sut.execute(input);

      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('number');
      expect(result.id).toBeGreaterThan(0);

      const saved = await prisma.company.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('Empresa LTDA');
      expect(saved?.fantasyName).toBe('Empresa');
      expect(saved?.document).toBe('09748165000110');
      expect(saved?.active).toBe(true);
      expect(saved?.email01).toBe('contato@empresa.com');
    });

    it('should create company with optional fields filled', async() => {
      const input = makeValidInput({
        ie: '123456789',
        complement: 'Sala 1',
        phone02: '1144445555',
        cellphone: '11999998888',
        email02: 'vendas@empresa.com',
      });

      const result = await sut.execute(input);

      expect(result).toHaveProperty('id');

      const saved = await prisma.company.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved?.ie).toBe('123456789');
      expect(saved?.complement).toBe('Sala 1');
      expect(saved?.phone02).toBe('1144445555');
      expect(saved?.cellphone).toBe('11999998888');
      expect(saved?.email02).toBe('vendas@empresa.com');
    });
  });

  describe('document already taken', () => {
    it('should throw DocumentAlreadyTakenError when document already exists', async() => {
      const input = makeValidInput();

      await sut.execute(input);

      await expect(sut.execute(input)).rejects.toThrow(DocumentAlreadyTakenError);
      await expect(sut.execute(input)).rejects.toThrow('O documento 09748165000110 já está em uso.');
    });

    it('should not persist company when document is already taken', async() => {
      const input = makeValidInput();
      await sut.execute(input);

      const input2 = makeValidInput({
        document: '09.748.165/0001-10',
        name: 'Outra Empresa',
      });

      await expect(sut.execute(input2)).rejects.toThrow(DocumentAlreadyTakenError);

      const companies = await prisma.company.findMany({ where: { document: '09748165000110' } });
      expect(companies).toHaveLength(1);
    });
  });

  describe('validation (factory)', () => {
    it('should throw when document has invalid format', async() => {
      const input = makeValidInput({ document: '123' });

      await expect(sut.execute(input)).rejects.toThrow(InvalidDocumentError);
    });

    it('should throw when name is empty', async() => {
      const input = makeValidInput({ name: '' });

      await expect(sut.execute(input)).rejects.toThrow('O campo name não pode ser vazio');
    });
  });
});
