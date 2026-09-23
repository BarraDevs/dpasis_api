import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailTemplateVariableModule } from '../../../email-template-variable.module';
import { EmailTemplateVariableAlreadyExistsError } from '../../../domain/errors/email-template-variable-already-exists.error';
import { CreateEmailTemplateVariable } from './create-email-template-variable.service';
import { CreateEmailTemplateVariableInputDto } from './dtos/create-email-template-variable.dto';

function uniqueKey(): string {
  return `nfse.k${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

describe('CreateEmailTemplateVariable - Integration tests', () => {
  let sut: CreateEmailTemplateVariable;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [EmailTemplateVariableModule],
    }).compile();

    sut = module.get(CreateEmailTemplateVariable);
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

  it('should throw EmailTemplateVariableAlreadyExistsError when creating with duplicate key', async() => {
    const input: CreateEmailTemplateVariableInputDto = { key: uniqueKey(), label: 'Número' };
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(EmailTemplateVariableAlreadyExistsError);
  });

  it('should create variable with active true and return id', async() => {
    const input: CreateEmailTemplateVariableInputDto = {
      key: uniqueKey(),
      label: 'Número da NFS-e',
      example: '123',
      description: 'Número da nota',
    };

    const result = await sut.execute(input);
    const saved = await prisma.emailTemplateVariable.findUnique({ where: { id: result.id } });

    expect(result.id).toBeDefined();
    expect(saved).toEqual(expect.objectContaining({
      key: input.key,
      label: input.label,
      example: '123',
      description: 'Número da nota',
      active: true,
    }));
  });
});
