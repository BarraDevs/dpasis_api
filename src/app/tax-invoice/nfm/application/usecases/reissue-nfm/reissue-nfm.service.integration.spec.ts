import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseQueueFakeAdapterProducer } from 'src/app/tax-invoice/nfse/infra/driven/queue/fake/nfse-queue-fake.producer';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfsGenerationFakeAdapterGateway } from 'src/infra/nfs-generation/adapters/fake/nfs-generation-fake.gateway';
import { NfsBatchErrorKind } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { NfmModule } from '../../../nfm.module';
import { ReissueNfm } from './reissue-nfm.service';

async function seedClient(prisma: PrismaService) {
  const [group, resale, company] = await Promise.all([
    prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
    prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    prisma.company.create({ data: buildMinimalCompanyData() }),
  ]);

  return prisma.client.create({
    data: {
      id: Date.now() % 100_000,
      type: ClientType.PJ,
      document: `${Date.now()}`.padStart(14, '0').slice(0, 14),
      ie: null,
      groupId: group.id,
      resaleId: resale.id,
      companyId: company.id,
      companyName: 'Cliente LTDA',
      fantasyName: null,
      headquarters: 'São Paulo',
      invoiceType: ClientInvoiceType.CONTRACT,
      generateInvoice: true,
      active: true,
    },
  });
}

async function seedCnaeNbsIndop(prisma: PrismaService): Promise<number> {
  const suffix = String(Date.now()).slice(-8);
  const cnae = await prisma.cnae.create({ data: { code: `C${suffix}`, description: 'CNAE Reissue' } });
  const nbs = await prisma.nbs.create({ data: { code: `N${suffix}`, description: 'NBS Reissue' } });
  const indop = await prisma.indop.create({ data: { code: `I${suffix}`, description: 'INDOP Reissue' } });
  const corr = await prisma.cnaeNbsIndop.create({
    data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id, serviceListItemCode: '01.07' },
  });
  return corr.id;
}

describe('ReissueNfm - Integration tests', () => {
  let sut: ReissueNfm;
  let prisma: PrismaService;
  let queueProducer: NfseQueueFakeAdapterProducer;
  let nfsGenerationGateway: NfsGenerationFakeAdapterGateway;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NfmModule],
    }).compile();

    sut = module.get(ReissueNfm);
    prisma = module.get(PrismaService);
    queueProducer = module.get(TOKENS.NfseQueueProducer);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
  });

  beforeEach(async() => {
    await prisma.truncate();
    queueProducer.addedIssueBatchJobs.length = 0;
    queueProducer.addedPollBatchJobs.length = 0;
    nfsGenerationGateway.findNfseByRpsCalls.length = 0;
    nfsGenerationGateway.findNfseByRpsError = null;
    nfsGenerationGateway.findNfseByRpsResult = { found: false };
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should reissue a REJECTED note with leftover protocol when Giss returns E212', async() => {
    // Arrange — cenário 10: situação 3 deixou protocolo; ConsultarNfsePorRps devolve E212.
    const company = await prisma.company.create({ data: buildMinimalCompanyData() });
    const client = await seedClient(prisma);
    await prisma.nfsProviderConfig.create({
      data: {
        companyId: company.id,
        vendor: 'giss',
        municipalRegistration: '12345',
        municipalCodeIbge: '3529401',
        serieRps: 'NFSE',
        environment: NfsProviderEnvironment.Demonstration,
        certFilePath: '/certs/x.pfx',
        certPasswordEnvVar: 'X_PASS',
        vendorConfig: { municipioSlug: 'demonstracao' },
      },
    });
    const cnaeNbsIndopId = await seedCnaeNbsIndop(prisma);
    const rpsNumber = Date.now() % 100_000;

    const nfse = await prisma.nfse.create({
      data: {
        companyId: company.id,
        clientId: client.id,
        rpsNumber,
        rpsSeries: 'NFSE',
        status: NfseStatus.REJECTED,
        batchProtocol: 'PROTO-VELHO',
        errorMessage: 'E163: CNPJ do tomador inválido',
        data: { providerDocument: company.document },
      },
    });

    const nfm = await prisma.nfm.create({
      data: {
        clientId: client.id,
        clientDocument: client.document,
        companyName: client.companyName,
        referenceMonth: 8,
        referenceYear: 2026,
        totalValueInCents: 10000,
        cnaeNbsIndopId,
        nfseId: nfse.id,
        data: { client: { id: client.id } },
      },
    });

    nfsGenerationGateway.findNfseByRpsResult = {
      found: false,
      errors: [{ code: 'E212', message: 'NFS-e não encontrada', kind: NfsBatchErrorKind.NotFound }],
    };

    // Act
    const result = await sut.execute(nfm.id, { reason: 'cadastro do tomador corrigido', confirm: true });

    // Assert — mesmo RPS, protocolo descartado, um job de emissão. Sem 409 de lote em voo.
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      status: NfseStatus.PENDING,
      batchProtocol: null,
      rpsNumber,
    });
    expect(queueProducer.addedIssueBatchJobs).toEqual([
      expect.objectContaining({ data: { nfseId: nfse.id } }),
    ]);
    expect(queueProducer.addedPollBatchJobs).toHaveLength(0);
    expect(result).toEqual({
      nfseId: nfse.id,
      rpsNumber,
      rpsSeries: 'NFSE',
      status: NfseStatus.PENDING,
    });
  });
});
