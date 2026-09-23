import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailTemplateAlreadyExistsError } from '../../../domain/errors/email-template-already-exists.error';
import { EmailTemplateNotFoundError } from '../../../domain/errors/email-template-not-found.error';
import { EmailTemplateModule } from '../../../email-template.module';
import { EditEmailTemplate } from './edit-email-template.service';

function uniqueName(): string {
  return `Cobranca ${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

describe('EditEmailTemplate - Integration tests', () => {
  let sut: EditEmailTemplate;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [EmailTemplateModule],
    }).compile();

    sut = module.get(EditEmailTemplate);
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

  it('should throw EmailTemplateNotFoundError when record does not exist', async() => {
    await expect(sut.execute(0, { subject: 'Novo' })).rejects.toThrow(EmailTemplateNotFoundError);
  });

  it('should update subject without changing name', async() => {
    const created = await prisma.emailTemplate.create({
      data: { name: uniqueName(), subject: 'Original', html: '<p>oi</p>' },
    });

    await sut.execute(created.id, { subject: 'Atualizado' });

    const updated = await prisma.emailTemplate.findUnique({ where: { id: created.id } });
    expect(updated?.subject).toBe('Atualizado');
    expect(updated?.name).toBe(created.name);
  });

  it('should throw EmailTemplateAlreadyExistsError when name belongs to another row', async() => {
    const nameA = uniqueName();
    await prisma.emailTemplate.create({
      data: { name: nameA, subject: 'A', html: '<p>a</p>' },
    });
    const rowB = await prisma.emailTemplate.create({
      data: { name: uniqueName(), subject: 'B', html: '<p>b</p>' },
    });

    await expect(sut.execute(rowB.id, { name: nameA })).rejects.toThrow(EmailTemplateAlreadyExistsError);
  });
});
