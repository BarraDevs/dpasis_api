import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailTemplateVariableUnknownError } from '../../../domain/errors/email-template-variable-unknown.error';
import { EmailTemplateVariableMissingValueError } from '../../../domain/errors/email-template-variable-missing-value.error';
import { EmailTemplateNotFoundError } from '../../../domain/errors/email-template-not-found.error';
import { EmailTemplateModule } from '../../../email-template.module';
import { RenderEmailTemplate } from './render-email-template.service';

describe('RenderEmailTemplate - Integration tests', () => {
  let sut: RenderEmailTemplate;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [EmailTemplateModule],
    }).compile();

    sut = module.get(RenderEmailTemplate);
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

  it('should throw EmailTemplateNotFoundError when template does not exist', async() => {
    await expect(sut.execute(0, { variables: {} })).rejects.toThrow(EmailTemplateNotFoundError);
  });

  it('should throw EmailTemplateVariableUnknownError when placeholder is inactive', async() => {
    const key = `nfse.numero${Date.now()}`;
    await prisma.emailTemplateVariable.create({
      data: { key, label: 'Número', active: false },
    });
    const template = await prisma.emailTemplate.create({
      data: { name: `T-${Date.now()}`, subject: `Nota {{${key}}}`, html: '<p>oi</p>' },
    });

    await expect(sut.execute(template.id, { variables: { [key]: '123' } })).rejects.toThrow(EmailTemplateVariableUnknownError);
  });

  it('should throw EmailTemplateVariableMissingValueError when value is absent', async() => {
    const key = `nfse.numero${Date.now()}`;
    await prisma.emailTemplateVariable.create({
      data: { key, label: 'Número', active: true },
    });
    const template = await prisma.emailTemplate.create({
      data: { name: `T-${Date.now()}`, subject: `Nota {{${key}}}`, html: '<p>oi</p>' },
    });

    await expect(sut.execute(template.id, { variables: {} })).rejects.toThrow(EmailTemplateVariableMissingValueError);
  });

  it('should render inactive template and ignore extra keys', async() => {
    const nfseKey = `nfse.numero${Date.now()}`;
    const clientKey = `cliente.nome${Date.now()}`;
    await prisma.emailTemplateVariable.createMany({
      data: [
        { key: nfseKey, label: 'Número', active: true },
        { key: clientKey, label: 'Cliente', active: true },
      ],
    });
    const template = await prisma.emailTemplate.create({
      data: {
        name: `T-${Date.now()}`,
        subject: `Nota {{${nfseKey}}}`,
        html: `<style>p { color: red; }</style><p>{{${clientKey}}}</p>`,
        active: false,
      },
    });

    const result = await sut.execute(template.id, {
      variables: { [nfseKey]: '123', [clientKey]: 'ACME', extra: 'ignored' },
    });

    expect(result).toEqual({
      subject: 'Nota 123',
      html: '<style>p { color: red; }</style><p>ACME</p>',
    });
  });
});
