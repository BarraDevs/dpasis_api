import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailTemplateVariableModule } from '../../../email-template-variable.module';
import { EmailTemplateVariableNotFoundError } from '../../../domain/errors/email-template-variable-not-found.error';
import { UpdateEmailTemplateVariableStatus } from './update-email-template-variable-status.service';

describe('UpdateEmailTemplateVariableStatus - Integration tests', () => {
  let sut: UpdateEmailTemplateVariableStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [EmailTemplateVariableModule],
    }).compile();

    sut = module.get(UpdateEmailTemplateVariableStatus);
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

  it('should invert active from true to false', async() => {
    const created = await prisma.emailTemplateVariable.create({
      data: { key: `nfse.k${Date.now()}`, label: 'Número', active: true },
    });

    await sut.execute(created.id);

    const updated = await prisma.emailTemplateVariable.findUnique({ where: { id: created.id } });
    expect(updated?.active).toBe(false);
  });
});
