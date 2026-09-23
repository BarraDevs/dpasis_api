import { Test } from '@nestjs/testing';
import { EmailTemplateVariableDto } from 'src/app/global/email-template-variable/application/dtos/email-template-variable.dto';
import { CreateEmailTemplateVariableInputDto } from 'src/app/global/email-template-variable/application/usecases/create-email-template-variable/dtos/create-email-template-variable.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailTemplateVariableDaoAdapterPrisma } from './email-template-variable-prisma.dao';

function uniqueKey(): string {
  return `nfse.k${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

describe('EmailTemplateVariableDaoAdapterPrisma - Integration tests', () => {
  let sut: EmailTemplateVariableDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [EmailTemplateVariableDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(EmailTemplateVariableDaoAdapterPrisma);
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

    it('should search in key, label and description', async() => {
      await prisma.emailTemplateVariable.createMany({
        data: [
          { key: uniqueKey(), label: 'Número', description: 'Código da nota' },
          { key: uniqueKey(), label: 'Cliente', description: 'Razão social' },
        ],
      });

      const [rows, total] = await sut.findAll({ search: 'nota' });

      expect(total).toBe(1);
      expect(rows[0].description).toContain('nota');
    });

    it('should order by key asc', async() => {
      const suffix = `${Date.now()}`;
      await prisma.emailTemplateVariable.create({ data: { key: `b.key${suffix}`, label: 'B' } });
      await prisma.emailTemplateVariable.create({ data: { key: `a.key${suffix}`, label: 'A' } });

      const [rows] = await sut.findAll({});

      expect(rows[0].key).toBe(`a.key${suffix}`);
      expect(rows[1].key).toBe(`b.key${suffix}`);
    });
  });

  describe('findByKey', () => {
    it('should return null when key does not exist', async() => {
      const result = await sut.findByKey('inexistente');

      expect(result).toBeNull();
    });

    it('should return the exact key', async() => {
      const key = uniqueKey();
      const created = await prisma.emailTemplateVariable.create({ data: { key, label: 'Número' } });

      const result = await sut.findByKey(key);

      expect(result?.id).toBe(created.id);
    });
  });

  describe('findActiveByKeys', () => {
    it('should return empty array when keys is empty', async() => {
      const result = await sut.findActiveByKeys([]);

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    it('should create variable and return id', async() => {
      const data: CreateEmailTemplateVariableInputDto = { key: uniqueKey(), label: 'Número' };

      const id = await sut.save(data);
      const saved = await prisma.emailTemplateVariable.findUnique({ where: { id } });

      expect(saved?.key).toBe(data.key);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit delete updateStatus', () => {
    it('should update, toggle status and delete', async() => {
      const created = await prisma.emailTemplateVariable.create({
        data: { key: uniqueKey(), label: 'Original' },
      });

      await sut.edit(created.id, { label: 'Novo' });
      const edited = await prisma.emailTemplateVariable.findUnique({ where: { id: created.id } });
      expect(edited?.label).toBe('Novo');

      await sut.updateStatus(created.id, false);
      const toggled = await prisma.emailTemplateVariable.findUnique({ where: { id: created.id } });
      expect(toggled?.active).toBe(false);

      await sut.delete(created.id);
      const deleted = await prisma.emailTemplateVariable.findUnique({ where: { id: created.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return all fields', async() => {
      const created = await prisma.emailTemplateVariable.create({
        data: { key: uniqueKey(), label: 'Número', example: '123', description: 'Desc' },
      });

      const result = await sut.findById(created.id);

      expect(result).toEqual<EmailTemplateVariableDto>({
        id: created.id,
        key: created.key,
        label: created.label,
        example: created.example,
        description: created.description,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });
});
