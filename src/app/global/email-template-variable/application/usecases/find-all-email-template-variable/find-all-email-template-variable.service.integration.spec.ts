import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailTemplateVariableModule } from '../../../email-template-variable.module';
import { FindAllEmailTemplateVariable } from './find-all-email-template-variable.service';

describe('FindAllEmailTemplateVariable - Integration tests', () => {
  let sut: FindAllEmailTemplateVariable;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [EmailTemplateVariableModule],
    }).compile();

    sut = module.get(FindAllEmailTemplateVariable);
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

  it('should return empty results when no variables exist', async() => {
    const result = await sut.execute({});

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should search in key and label', async() => {
    await prisma.emailTemplateVariable.createMany({
      data: [
        { key: `nfse.numero${Date.now()}`, label: 'Número da nota' },
        { key: `cliente.nome${Date.now()}`, label: 'Nome do cliente' },
      ],
    });

    const result = await sut.execute({ search: 'numero' });

    expect(result.totalItems).toBe(1);
    expect(result.data[0].key).toContain('nfse.numero');
  });

  it('should filter by active', async() => {
    await prisma.emailTemplateVariable.createMany({
      data: [
        { key: `a.key${Date.now()}`, label: 'Ativa', active: true },
        { key: `b.key${Date.now()}`, label: 'Inativa', active: false },
      ],
    });

    const result = await sut.execute({ active: false });

    expect(result.totalItems).toBe(1);
    expect(result.data[0].active).toBe(false);
  });
});
