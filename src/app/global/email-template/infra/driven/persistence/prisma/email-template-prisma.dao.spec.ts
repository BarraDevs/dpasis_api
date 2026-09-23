import { Test } from '@nestjs/testing';
import { EmailTemplateDto } from 'src/app/global/email-template/application/dtos/email-template.dto';
import { CreateEmailTemplateInputDto } from 'src/app/global/email-template/application/usecases/create-email-template/dtos/create-email-template.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailTemplateDaoAdapterPrisma } from './email-template-prisma.dao';

function uniqueName(): string {
  return `Cobranca ${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

describe('EmailTemplateDaoAdapterPrisma - Integration tests', () => {
  let sut: EmailTemplateDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [EmailTemplateDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(EmailTemplateDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return empty array when no records exist', async() => {
      const [rows, total] = await sut.findAll({});

      expect(rows).toEqual([]);
      expect(total).toBe(0);
    });

    it('should search in name, description and subject', async() => {
      await prisma.emailTemplate.createMany({
        data: [
          { name: uniqueName(), description: 'Nota fiscal', subject: 'Emissão', html: '<p>a</p>', css: '' },
          { name: uniqueName(), description: 'Boas-vindas', subject: 'Hello', html: '<p>b</p>', css: '' },
        ],
      });

      const [rows, total] = await sut.findAll({ search: 'nota' });

      expect(total).toBe(1);
      expect(rows[0].description).toContain('Nota');
    });
  });

  describe('findByName', () => {
    it('should find by name case-insensitive', async() => {
      const name = uniqueName();
      const created = await prisma.emailTemplate.create({
        data: { name, subject: 'S', html: '<p>oi</p>', css: '' },
      });

      const result = await sut.findByName(name.toUpperCase());

      expect(result?.id).toBe(created.id);
    });
  });

  describe('save', () => {
    it('should create template and return id', async() => {
      const data: CreateEmailTemplateInputDto = {
        name: uniqueName(),
        subject: 'Assunto',
        html: '<p>oi</p>',
        css: '',
      };

      const id = await sut.save(data);
      const saved = await prisma.emailTemplate.findUnique({ where: { id } });

      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('findById', () => {
    it('should return all fields', async() => {
      const created = await prisma.emailTemplate.create({
        data: { name: uniqueName(), description: 'Desc', subject: 'S', html: '<p>oi</p>', css: 'p{}' },
      });

      const result = await sut.findById(created.id);

      expect(result).toEqual<EmailTemplateDto>({
        id: created.id,
        name: created.name,
        description: created.description,
        subject: created.subject,
        html: created.html,
        css: created.css,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });
});
