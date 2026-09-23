import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailTemplateVariableModule } from '../../../email-template-variable.module';
import { EmailTemplateVariableNotFoundError } from '../../../domain/errors/email-template-variable-not-found.error';
import { FindEmailTemplateVariableById } from './find-email-template-variable-by-id.service';

describe('FindEmailTemplateVariableById - Integration tests', () => {
  let sut: FindEmailTemplateVariableById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [EmailTemplateVariableModule],
    }).compile();

    sut = module.get(FindEmailTemplateVariableById);
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

  it('should return variable by id', async() => {
    const created = await prisma.emailTemplateVariable.create({
      data: { key: `nfse.k${Date.now()}`, label: 'Número' },
    });

    const result = await sut.execute(created.id);

    expect(result.id).toBe(created.id);
    expect(result.key).toBe(created.key);
    expect(result.label).toBe('Número');
  });
});
