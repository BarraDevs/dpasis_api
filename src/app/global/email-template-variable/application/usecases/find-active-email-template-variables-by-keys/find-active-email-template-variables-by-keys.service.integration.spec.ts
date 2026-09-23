import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailTemplateVariableModule } from '../../../email-template-variable.module';
import { FindActiveEmailTemplateVariablesByKeys } from './find-active-email-template-variables-by-keys.service';

describe('FindActiveEmailTemplateVariablesByKeys - Integration tests', () => {
  let sut: FindActiveEmailTemplateVariablesByKeys;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [EmailTemplateVariableModule],
    }).compile();

    sut = module.get(FindActiveEmailTemplateVariablesByKeys);
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

  it('should return only active keys among the requested ones', async() => {
    const suffix = `${Date.now()}`;
    await prisma.emailTemplateVariable.createMany({
      data: [
        { key: `nfse.ativa${suffix}`, label: 'Ativa', active: true },
        { key: `nfse.inativa${suffix}`, label: 'Inativa', active: false },
      ],
    });

    const result = await sut.execute([`nfse.ativa${suffix}`, `nfse.inativa${suffix}`, 'inexistente']);

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe(`nfse.ativa${suffix}`);
  });
});
