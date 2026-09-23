import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailTemplateAlreadyExistsError } from '../../../domain/errors/email-template-already-exists.error';
import { EmailTemplateModule } from '../../../email-template.module';
import { CreateEmailTemplate } from './create-email-template.service';
import { CreateEmailTemplateInputDto } from './dtos/create-email-template.dto';

function uniqueName(): string {
  return `Cobranca ${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

function makeInput(overrides: Partial<CreateEmailTemplateInputDto> = {}): CreateEmailTemplateInputDto {
  return {
    name: uniqueName(),
    subject: 'Sua NFS-e {{nfse.numero}}',
    html: '<p>{{cliente.nome}}</p>',
    css: 'p { color: #222; }',
    ...overrides,
  };
}

describe('CreateEmailTemplate - Integration tests', () => {
  let sut: CreateEmailTemplate;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [EmailTemplateModule],
    }).compile();

    sut = module.get(CreateEmailTemplate);
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

  it('should throw EmailTemplateAlreadyExistsError when creating with duplicate name', async() => {
    const input = makeInput();
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(EmailTemplateAlreadyExistsError);
  });

  it('should create template with active true and return id', async() => {
    const input = makeInput({ description: 'E-mail da cobrança' });
    const result = await sut.execute(input);
    const saved = await prisma.emailTemplate.findUnique({ where: { id: result.id } });

    expect(saved).toEqual(expect.objectContaining({
      name: input.name,
      description: 'E-mail da cobrança',
      subject: input.subject,
      html: input.html,
      css: input.css,
      active: true,
    }));
  });
});
