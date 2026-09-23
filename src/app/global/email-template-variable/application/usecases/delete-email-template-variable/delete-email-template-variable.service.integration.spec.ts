import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailTemplateVariableModule } from '../../../email-template-variable.module';
import { EmailTemplateVariableNotFoundError } from '../../../domain/errors/email-template-variable-not-found.error';
import { DeleteEmailTemplateVariable } from './delete-email-template-variable.service';

describe('DeleteEmailTemplateVariable - Integration tests', () => {
  let sut: DeleteEmailTemplateVariable;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [EmailTemplateVariableModule],
    }).compile();

    sut = module.get(DeleteEmailTemplateVariable);
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
    await expect(sut.execute(0)).rejects.toThrow(EmailTemplateVariableNotFoundError);
  });

  it('should delete even if a template still uses the key', async() => {
    const created = await prisma.emailTemplateVariable.create({
      data: { key: `nfse.k${Date.now()}`, label: 'Número' },
    });
    await prisma.emailTemplate.create({
      data: {
        name: `T-${Date.now()}`,
        subject: `Nota {{${created.key}}}`,
        html: '<p>oi</p>',
        css: '',
      },
    });

    await sut.execute(created.id);

    const deleted = await prisma.emailTemplateVariable.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });
});
