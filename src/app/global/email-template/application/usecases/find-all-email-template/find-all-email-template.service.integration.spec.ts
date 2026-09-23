import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailTemplateModule } from '../../../email-template.module';
import { FindAllEmailTemplate } from './find-all-email-template.service';

describe('FindAllEmailTemplate - Integration tests', () => {
  let sut: FindAllEmailTemplate;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [EmailTemplateModule],
    }).compile();

    sut = module.get(FindAllEmailTemplate);
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

  it('should return empty results when no templates exist', async() => {
    const result = await sut.execute({});

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should search in name, description and subject', async() => {
    await prisma.emailTemplate.createMany({
      data: [
        { name: `Cobranca ${Date.now()}`, description: 'Nota fiscal', subject: 'Emissão', html: '<p>a</p>', css: '' },
        { name: `Outro ${Date.now()}`, description: 'Boas-vindas', subject: 'Bem-vindo', html: '<p>b</p>', css: '' },
      ],
    });

    const result = await sut.execute({ search: 'nota' });

    expect(result.totalItems).toBe(1);
    expect(result.data[0].description).toContain('Nota');
  });
});
