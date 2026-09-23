import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailTemplateVariableModule } from '../../../email-template-variable.module';
import { EmailTemplateVariableAlreadyExistsError } from '../../../domain/errors/email-template-variable-already-exists.error';
import { EmailTemplateVariableNotFoundError } from '../../../domain/errors/email-template-variable-not-found.error';
import { EditEmailTemplateVariable } from './edit-email-template-variable.service';

function uniqueKey(): string {
  return `nfse.k${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

describe('EditEmailTemplateVariable - Integration tests', () => {
  let sut: EditEmailTemplateVariable;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [EmailTemplateVariableModule],
    }).compile();

    sut = module.get(EditEmailTemplateVariable);
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

  it('should throw EmailTemplateVariableNotFoundError when record does not exist', async() => {
    await expect(sut.execute(0, { label: 'Novo' })).rejects.toThrow(EmailTemplateVariableNotFoundError);
  });

  it('should update label and keep key', async() => {
    const created = await prisma.emailTemplateVariable.create({
      data: { key: uniqueKey(), label: 'Original' },
    });

    await sut.execute(created.id, { label: 'Atualizado' });

    const updated = await prisma.emailTemplateVariable.findUnique({ where: { id: created.id } });
    expect(updated?.label).toBe('Atualizado');
    expect(updated?.key).toBe(created.key);
  });

  it('should throw EmailTemplateVariableAlreadyExistsError when key belongs to another row', async() => {
    const keyA = uniqueKey();
    await prisma.emailTemplateVariable.create({ data: { key: keyA, label: 'A' } });
    const rowB = await prisma.emailTemplateVariable.create({ data: { key: uniqueKey(), label: 'B' } });

    await expect(sut.execute(rowB.id, { key: keyA })).rejects.toThrow(EmailTemplateVariableAlreadyExistsError);
  });

  it('should allow edit when key belongs to the same row', async() => {
    const key = uniqueKey();
    const created = await prisma.emailTemplateVariable.create({ data: { key, label: 'A' } });

    await sut.execute(created.id, { key, label: 'A2' });

    const updated = await prisma.emailTemplateVariable.findUnique({ where: { id: created.id } });
    expect(updated?.label).toBe('A2');
  });
});
