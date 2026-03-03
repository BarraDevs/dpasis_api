import { Test } from '@nestjs/testing';
import { CompanyModule } from 'src/app/company/company/company.module';
import { CompanyNotFoundError } from 'src/app/company/company/domain/errors/company-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CompanyProps } from '../../../domain/entities/company.entity';
import { ActivateCompany } from './activate-company.service';

function makeCompany(overrides?: Partial<CompanyProps>): CompanyProps {
  return {
    id: 1,
    name: 'Empresa LTDA',
    fantasyName: 'Empresa',
    document: '09748165000110',
    ie: null,
    active: false,
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

describe('ActivateCompany - Integration tests', () => {
  let sut: ActivateCompany;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CompanyModule],
    }).compile();

    sut = module.get(ActivateCompany);
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

  it('should throw CompanyNotFoundError when company does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(CompanyNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow('Empresa não encontrada na base de dados.');
  });

  it('should activate company in database', async() => {
    const company = await prisma.company.create({
      data: makeCompany({
        active: false,
      }),
    });

    await sut.execute(company.id);

    const updated = await prisma.company.findUnique({ where: { id: company.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const company = await prisma.company.create({
      data: makeCompany({
        active: false,
      }),
    });

    const result = await sut.execute(company.id);

    expect(result).toEqual({ message: 'Empresa ativada com sucesso' });
  });

  it('should be idempotent when company is already active', async() => {
    const company = await prisma.company.create({
      data: makeCompany({
        active: true,
      }),
    });

    const result = await sut.execute(company.id);

    expect(result).toEqual({ message: 'Empresa ativada com sucesso' });

    const updated = await prisma.company.findUnique({ where: { id: company.id } });
    expect(updated?.active).toBe(true);
  });
});
