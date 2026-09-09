/**
 * Dados mínimos para o curl em curl.md (companyId 516, clientId 9999999).
 * Uso: dotenv -e .env.development -- ts-node prisma/seeds/nfse-curl-manual-test.ts
 */
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { ClientAddressType } from '../../src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceType } from '../../src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from '../../src/app/client/client/domain/enums/client-type.enum';
import { NfsProviderEnvironment } from '../../src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';

const COMPANY_ID = 516;
const CLIENT_ID = 9999999;
const PROVIDER_CNPJ = '02099923000178';

const certFilePath = join(
  __dirname,
  '../../resources/files/nfs-generation/giss/DPA_TEC_EQUIPAMENTOS_DE_PONTO_LTDA_02099923000178.pfx',
);

const prisma = new PrismaClient();

async function main() {
  const [group, resale] = await Promise.all([
    prisma.clientGroup.findFirst({ select: { id: true } }),
    prisma.resale.findFirst({ select: { id: true } }),
  ]);

  if (!group || !resale) {
    throw new Error('Precisa de client_groups e resales (rode prisma db seed ou find-elegible-clients-nfm).');
  }

  await prisma.company.upsert({
    where: { id: COMPANY_ID },
    create: {
      id: COMPANY_ID,
      name: 'DPA TEC EQUIPAMENTOS DE PONTO LTDA',
      fantasyName: 'DPA TEC',
      document: PROVIDER_CNPJ,
      active: true,
      zipCode: '08780-000',
      street: 'Rua Exemplo',
      number: '100',
      neighborhood: 'Centro',
      city: 'Mogi das Cruzes',
      state: 'SP',
      phone01: '1140000000',
      email01: 'nfse-manual-test@dpasis.local',
    },
    update: {
      document: PROVIDER_CNPJ,
      active: true,
    },
  });

  await prisma.$executeRawUnsafe(
    'SELECT setval(pg_get_serial_sequence(\'companies\', \'id\'), (SELECT MAX(id) FROM companies))',
  );

  await prisma.client.upsert({
    where: { id: CLIENT_ID },
    create: {
      id: CLIENT_ID,
      type: ClientType.PJ,
      document: '58982473000111',
      groupId: group.id,
      resaleId: resale.id,
      companyId: COMPANY_ID,
      companyName: '58982473 YUDI MATSUGUMA',
      headquarters: 'São Paulo',
      invoiceType: ClientInvoiceType.CONTRACT,
      generateInvoice: true,
      active: true,
    },
    update: {
      active: true,
      companyId: COMPANY_ID,
    },
  });

  const seq = await prisma.clientSequence.findUnique({ where: { id: 1 } });
  if (!seq || seq.nextId <= CLIENT_ID) {
    await prisma.clientSequence.upsert({
      where: { id: 1 },
      create: { id: 1, nextId: CLIENT_ID + 1 },
      update: { nextId: CLIENT_ID + 1 },
    });
  }

  await prisma.nfsProviderConfig.upsert({
    where: { companyId: COMPANY_ID },
    create: {
      companyId: COMPANY_ID,
      vendor: 'giss',
      municipalRegistration: '16895',
      municipalCodeIbge: '3529401',
      serieRps: 'NFSE',
      environment: NfsProviderEnvironment.Production,
      certFilePath,
      certPasswordEnvVar: 'GISS_CERT_PASSWORD',
      vendorConfig: { municipioSlug: 'maua' },
      issRate: 0.0387,
      municipalTaxCode: '620230001',
    },
    update: {
      vendor: 'giss',
      municipalRegistration: '16895',
      municipalCodeIbge: '3529401',
      serieRps: 'NFSE',
      environment: NfsProviderEnvironment.Production,
      certFilePath,
      certPasswordEnvVar: 'GISS_CERT_PASSWORD',
      vendorConfig: { municipioSlug: 'maua' },
      issRate: 0.0387,
      municipalTaxCode: '620230001',
    },
  });

  const rpsSequenceFloor = 80_630;
  const existingSeq = await prisma.nfseRpsSequence.findUnique({
    where: { companyId: COMPANY_ID },
    select: { nextId: true },
  });
  await prisma.nfseRpsSequence.upsert({
    where: { companyId: COMPANY_ID },
    create: { companyId: COMPANY_ID, nextId: rpsSequenceFloor },
    update: {
      nextId: Math.max(existingSeq?.nextId ?? 0, rpsSequenceFloor),
    },
  });

  await prisma.clientAddress.upsert({
    where: {
      clientId_type: {
        clientId: CLIENT_ID,
        type: ClientAddressType.BILLING,
      },
    },
    create: {
      clientId: CLIENT_ID,
      type: ClientAddressType.BILLING,
      zipCode: '08780-000',
      street: 'Rua Teste NFSe',
      number: '200',
      complement: 'Sala 1',
      neighborhood: 'Centro',
      city: 'Mogi das Cruzes',
      cityCodeIbge: '3530607',
      state: 'SP',
      active: true,
    },
    update: {
      cityCodeIbge: '3530607',
      active: true,
    },
  });

  console.log('NFSe manual test data ready:', { companyId: COMPANY_ID, clientId: CLIENT_ID, certFilePath });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async() => {
    await prisma.$disconnect();
  });
