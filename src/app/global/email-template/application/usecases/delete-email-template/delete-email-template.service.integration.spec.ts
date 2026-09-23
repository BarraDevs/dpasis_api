import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailTemplateNotFoundError } from '../../../domain/errors/email-template-not-found.error';
import { EmailTemplateModule } from '../../../email-template.module';
import { DeleteEmailTemplate } from './delete-email-template.service';

describe('DeleteEmailTemplate - Integration tests', () => {
  let sut: DeleteEmailTemplate;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [EmailTemplateModule],
    }).compile();

    sut = module.get(DeleteEmailTemplate);
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

  it('should delete template from database', async() => {
    const created = await prisma.emailTemplate.create({
      data: { name: `T-${Date.now()}`, subject: 'S', html: '<p>oi</p>' },
    });

    await sut.execute(created.id);

    const deleted = await prisma.emailTemplate.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });
});
