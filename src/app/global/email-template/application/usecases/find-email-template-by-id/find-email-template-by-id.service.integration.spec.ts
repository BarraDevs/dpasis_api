import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailTemplateNotFoundError } from '../../../domain/errors/email-template-not-found.error';
import { EmailTemplateModule } from '../../../email-template.module';
import { FindEmailTemplateById } from './find-email-template-by-id.service';

describe('FindEmailTemplateById - Integration tests', () => {
  let sut: FindEmailTemplateById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [EmailTemplateModule],
    }).compile();

    sut = module.get(FindEmailTemplateById);
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
    await expect(sut.execute(0)).rejects.toThrow(EmailTemplateNotFoundError);
  });

  it('should return template by id including inactive ones', async() => {
    const created = await prisma.emailTemplate.create({
      data: { name: `T-${Date.now()}`, subject: 'S', html: '<p>oi</p>', css: '', active: false },
    });

    const result = await sut.execute(created.id);

    expect(result.id).toBe(created.id);
    expect(result.active).toBe(false);
  });
});
