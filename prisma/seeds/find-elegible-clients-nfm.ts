import { Prisma, PrismaClient } from '@prisma/client';
import { ClientAddressType } from '../../src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigDueDateType } from '../../src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from '../../src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceType } from '../../src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from '../../src/app/client/client/domain/enums/client-type.enum';
import { NfsProviderEnvironment } from '../../src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { ClientSequenceSeed } from './client-sequence';
import { requireGissCertPath } from './giss-cert-path';
import { ResaleSequenceSeed } from './resale-sequence';

/**
 * Cenários fixos para exercitar `FindElegibleClients` / `SaveElegibleNfms` e `GET|POST /admin/nfm`.
 *
 * - `dueDateDay` dos elegíveis = dia do mês de hoje (`new Date().getDate()`), igual ao use case.
 * - `emissionDay` ajustado para manter `dueDateDay - emissionDay >= 15` quando possível.
 * - IDs na faixa `9_500_0xx` e CNPJs `88.888.888/000x-xx` só para seed.
 * - `9_999_999` = cliente do curl NFSe (`nfse-curl-manual-test.ts`, company 516 / GISS).
 * - Sequência RPS da company 516 sobe para piso `80_650` no seed (evita E10 no GISS após resets locais).
 *
 * Se mudar o dia do calendário e a lista vier vazia, rode o seed de novo (`npm run db:seed`).
 * Use o mesmo fuso do servidor da API.
 *
 * | clientId  | Elegível? | Motivo (quando não)                    |
 * |-----------|-----------|----------------------------------------|
 * | 9_500_001 | sim       | —                                      |
 * | 9_500_002 | sim       | — (2º elegível, múltiplos no POST)      |
 * | 9_500_003 | não       | `dueDateDay` ≠ hoje                    |
 * | 9_500_004 | não       | `generateNf: false`                    |
 * | 9_500_005 | não       | cliente `active: false`                |
 * | 9_500_006 | não       | `generateInvoice: false`               |
 * | 9_500_007 | não       | `invoiceType` Avulso (não Contrato)    |
 * | 9_500_008 | não       | sem itens no cliente                   |
 * | 9_500_009 | não       | só itens `active: false`               |
 * | 9_999_999 | sim       | curl.md — 2 cnaeNbsIndop → 2 NFS-e    |
 *
 * Uso junto do seed principal (`index.ts`) ou isolado:
 *
 * ```bash
 * dotenv -e .env.development -- ts-node prisma/seeds/find-elegible-clients-nfm.ts
 * ```
 */
export const SEED_NFM_ELEGIBLE_CLIENT_IDS = [9_500_001, 9_500_002, 9_999_999] as const;

const SEED_NFSE_CURL_CLIENT_ID = 9_999_999;
const SEED_NFSE_CURL_COMPANY_ID = 516;
const SEED_NFSE_CURL_PROVIDER_CNPJ = '02099923000178';
const SEED_GROUP_NAME = '__seed_nfm_elegivel_client_group';
const SEED_BANK_CODE = '__SEED_NFM__';
const SEED_BANK_AGENCY = '0001';
const SEED_BANK_ACCOUNT = '00000-0';

type SeedClientItemsMode = 'active' | 'inactive' | 'none' | 'split-cnae';

type SeedBillingAddress = {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  cityCodeIbge: string;
  state: string;
};

type SeedClientProfile = {
  id: number;
  document: string;
  companyName: string;
  fantasyName: string;
  eligible: boolean;
  filterNote: string;
  invoiceType?: ClientInvoiceType;
  generateInvoice?: boolean;
  active?: boolean;
  generateNf?: boolean;
  dueDateDay?: number;
  items?: SeedClientItemsMode;
  companyId?: number;
  headquarters?: string;
  billingAddress?: SeedBillingAddress;
};

const SEED_CLIENT_PROFILES: SeedClientProfile[] = [
  {
    id: 9_500_001,
    document: '88.888.888/0001-88',
    companyName: 'Cliente seed NFM elegível #1',
    fantasyName: 'NFM Elegível 1',
    eligible: true,
    filterNote: 'contrato + fatura + NF + ativo + vencimento hoje + itens ativos',
    items: 'active',
  },
  {
    id: 9_500_002,
    document: '88.888.888/0002-68',
    companyName: 'Cliente seed NFM elegível #2',
    fantasyName: 'NFM Elegível 2',
    eligible: true,
    filterNote: 'mesmo critério do #1 (testar lista com mais de um)',
    items: 'active',
  },
  {
    id: 9_500_003,
    document: '88.888.888/0003-49',
    companyName: 'Cliente seed NFM — vencimento outro dia',
    fantasyName: 'NFM dueDate outro dia',
    eligible: false,
    filterNote: 'dueDateDay ≠ hoje',
    items: 'active',
  },
  {
    id: 9_500_004,
    document: '88.888.888/0004-20',
    companyName: 'Cliente seed NFM — sem gerar NF',
    fantasyName: 'NFM generateNf false',
    eligible: false,
    filterNote: 'generateNf: false',
    generateNf: false,
    items: 'active',
  },
  {
    id: 9_500_005,
    document: '88.888.888/0005-00',
    companyName: 'Cliente seed NFM — inativo',
    fantasyName: 'NFM cliente inativo',
    eligible: false,
    filterNote: 'cliente active: false',
    active: false,
    items: 'active',
  },
  {
    id: 9_500_006,
    document: '88.888.888/0006-91',
    companyName: 'Cliente seed NFM — sem gerar fatura',
    fantasyName: 'NFM generateInvoice false',
    eligible: false,
    filterNote: 'generateInvoice: false',
    generateInvoice: false,
    items: 'active',
  },
  {
    id: 9_500_007,
    document: '88.888.888/0007-72',
    companyName: 'Cliente seed NFM — avulso',
    fantasyName: 'NFM tipo Avulso',
    eligible: false,
    filterNote: 'invoiceType Avulso (não Contrato)',
    invoiceType: ClientInvoiceType.INDIVIDUAL,
    items: 'active',
  },
  {
    id: 9_500_008,
    document: '88.888.888/0008-53',
    companyName: 'Cliente seed NFM — sem itens',
    fantasyName: 'NFM sem itens',
    eligible: false,
    filterNote: 'config ok, sem itens ativos',
    items: 'none',
  },
  {
    id: 9_500_009,
    document: '88.888.888/0009-34',
    companyName: 'Cliente seed NFM — itens inativos',
    fantasyName: 'NFM itens inativos',
    eligible: false,
    filterNote: 'itens cadastrados com active: false',
    items: 'inactive',
  },
  {
    id: SEED_NFSE_CURL_CLIENT_ID,
    document: '58982473000111',
    companyName: '58982473 YUDI MATSUGUMA',
    fantasyName: 'NFSe curl Yudi',
    eligible: true,
    filterNote: 'curl.md — 2 itens, 2 cnaeNbsIndop (2 NFMs / 2 NFS-e)',
    items: 'split-cnae',
    companyId: SEED_NFSE_CURL_COMPANY_ID,
    headquarters: 'São Paulo',
    billingAddress: {
      zipCode: '08780-000',
      street: 'Rua Teste NFSe',
      number: '200',
      complement: 'Sala 1',
      neighborhood: 'Centro',
      city: 'Mogi das Cruzes',
      cityCodeIbge: '3530607',
      state: 'SP',
    },
  },
];

type SeedDeps = {
  groupId: number;
  resaleId: number;
  companyId: number;
  bankId: number;
  cnaeNbsIndopId: number;
  cnaeNbsIndopId2: number;
  todayDueDay: number;
  emissionDay: number;
  notTodayDueDay: number;
};

export class FindElegibleClientsNfmSeed {
  static async seed(prisma: PrismaClient): Promise<void> {
    const todayDueDay = new Date().getDate();
    const notTodayDueDay = todayDueDay >= 28 ? 1 : todayDueDay + 1;
    /** Mantém `dueDateDay - emissionDay >= 15` quando `todayDueDay >= 16` (alinhado ao VO de vencimento). */
    const emissionDay = todayDueDay >= 16 ? todayDueDay - 15 : 1;
    const [cnaeNbsIndopId, cnaeNbsIndopId2] = await this.ensureCnaeNbsIndopPair(prisma);

    const deps: SeedDeps = {
      groupId: await this.ensureClientGroup(prisma),
      resaleId: await this.ensureResale(prisma),
      companyId: await this.ensureCompany(prisma),
      bankId: await this.ensureBank(prisma),
      cnaeNbsIndopId,
      cnaeNbsIndopId2,
      todayDueDay,
      emissionDay,
      notTodayDueDay,
    };

    await this.ensureNfseCurlCompany(prisma);

    for (const profile of SEED_CLIENT_PROFILES) {
      await this.upsertSeedClient(prisma, deps, profile);
    }

    await ClientSequenceSeed.seed(prisma);
    await ResaleSequenceSeed.seed(prisma);

    const eligibleIds = SEED_CLIENT_PROFILES.filter(p => p.eligible).map(p => p.id);
    const skipped = SEED_CLIENT_PROFILES.filter(p => !p.eligible);

    console.log(
      `[FindElegibleClientsNfmSeed] Pronto — dueDateDay=${todayDueDay} (hoje).`,
    );
    console.log(
      `[FindElegibleClientsNfmSeed] Elegíveis (esperado em GET /admin/nfm): ${eligibleIds.join(', ')}`,
    );
    console.log(
      `[FindElegibleClientsNfmSeed] Cliente ${SEED_NFSE_CURL_CLIENT_ID}: 2 NFMs (cnaeNbsIndop ${deps.cnaeNbsIndopId} e ${deps.cnaeNbsIndopId2}).`,
    );
    console.log(
      `[FindElegibleClientsNfmSeed] Não elegíveis (${skipped.length}):`,
    );
    for (const profile of skipped) {
      console.log(`  - clientId=${profile.id}: ${profile.filterNote}`);
    }
  }

  private static async upsertSeedClient(
    prisma: PrismaClient,
    deps: SeedDeps,
    profile: SeedClientProfile,
  ): Promise<void> {
    const dueDateDay = profile.dueDateDay ?? (profile.id === 9_500_003 ? deps.notTodayDueDay : deps.todayDueDay);
    const companyId = profile.companyId ?? deps.companyId;
    const billingAddressData: SeedBillingAddress = profile.billingAddress ?? {
      zipCode: '01310-100',
      street: 'Av. Paulista',
      number: String(profile.id).slice(-4),
      complement: `Seed NFM ${profile.id}`,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      cityCodeIbge: '3550308',
      state: 'SP',
    };

    const clientData: Prisma.ClientCreateInput = {
      id: profile.id,
      type: ClientType.PJ,
      document: profile.document,
      ie: null,
      group: { connect: { id: deps.groupId } },
      resale: { connect: { id: deps.resaleId } },
      company: { connect: { id: companyId } },
      companyName: profile.companyName,
      fantasyName: profile.fantasyName,
      headquarters: profile.headquarters ?? 'Matriz',
      invoiceType: profile.invoiceType ?? ClientInvoiceType.CONTRACT,
      generateInvoice: profile.generateInvoice ?? true,
      active: profile.active ?? true,
    };

    await prisma.client.upsert({
      where: { id: profile.id },
      create: clientData,
      update: {
        document: profile.document,
        companyName: profile.companyName,
        fantasyName: profile.fantasyName,
        headquarters: profile.headquarters ?? 'Matriz',
        invoiceType: profile.invoiceType ?? ClientInvoiceType.CONTRACT,
        generateInvoice: profile.generateInvoice ?? true,
        active: profile.active ?? true,
        group: { connect: { id: deps.groupId } },
        resale: { connect: { id: deps.resaleId } },
        company: { connect: { id: companyId } },
      },
    });

    const billingAddress = await prisma.clientAddress.upsert({
      where: {
        // eslint-disable-next-line camelcase
        clientId_type: {
          clientId: profile.id,
          type: ClientAddressType.BILLING,
        },
      },
      create: {
        clientId: profile.id,
        type: ClientAddressType.BILLING,
        ...billingAddressData,
        active: true,
      },
      update: { ...billingAddressData, active: true },
    });

    await prisma.clientInvoiceConfig.upsert({
      where: { clientId: profile.id },
      create: {
        clientId: profile.id,
        generateNf: profile.generateNf ?? true,
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay: deps.emissionDay,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay,
        dueMonth: null,
        deadlineDays: null,
        months: [],
        billingAddressId: billingAddress.id,
        bankId: deps.bankId,
        autoProtestBoleto: false,
        message: `Seed NFM — ${profile.filterNote}`,
      },
      update: {
        generateNf: profile.generateNf ?? true,
        emissionDay: deps.emissionDay,
        dueDateDay,
        billingAddressId: billingAddress.id,
        bankId: deps.bankId,
      },
    });

    await prisma.clientItem.deleteMany({ where: { clientId: profile.id } });

    const itemsMode = profile.items ?? 'active';
    if (itemsMode === 'none') {
      return;
    }

    const splitCnae = itemsMode === 'split-cnae';
    const itemActive = itemsMode !== 'inactive';
    await prisma.clientItem.createMany({
      data: [
        {
          clientId: profile.id,
          description: splitCnae
            ? `Item seed NFM — grupo CNAE/NBS/INDOP #1 (${profile.fantasyName})`
            : `Item seed NFM — serviço (${profile.fantasyName})`,
          quantity: 20,
          unitValueInCents: 100,
          cnaeNbsIndopId: deps.cnaeNbsIndopId,
          active: itemActive,
        },
        {
          clientId: profile.id,
          description: splitCnae
            ? `Item seed NFM — grupo CNAE/NBS/INDOP #2 (${profile.fantasyName})`
            : `Item seed NFM — manutenção (${profile.fantasyName})`,
          quantity: 31,
          unitValueInCents: 50,
          cnaeNbsIndopId: splitCnae ? deps.cnaeNbsIndopId2 : deps.cnaeNbsIndopId,
          active: itemActive,
        },
      ],
    });
  }

  private static async ensureClientGroup(prisma: PrismaClient): Promise<number> {
    const group = await prisma.clientGroup.upsert({
      where: { name: SEED_GROUP_NAME },
      create: { name: SEED_GROUP_NAME, active: true },
      update: { active: true },
      select: { id: true },
    });
    return group.id;
  }

  private static async ensureCompany(prisma: PrismaClient): Promise<number> {
    const found = await prisma.company.findFirst({ select: { id: true } });
    if (found) {
      return found.id;
    }

    const company = await prisma.company.create({
      data: {
        name: 'Empresa seed NFM',
        fantasyName: 'Seed NFM',
        document: '88.888.888/0000-00',
        ie: null,
        active: true,
        zipCode: '01310-100',
        street: 'Av. Paulista',
        number: '1000',
        complement: null,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        phone01: '11999999999',
        phone02: null,
        cellphone: null,
        email01: 'seed-nfm@test.com',
        email02: null,
      },
    });
    return company.id;
  }

  private static async ensureNfseCurlCompany(prisma: PrismaClient): Promise<void> {
    await prisma.company.upsert({
      where: { id: SEED_NFSE_CURL_COMPANY_ID },
      create: {
        id: SEED_NFSE_CURL_COMPANY_ID,
        name: 'DPA TEC EQUIPAMENTOS DE PONTO LTDA',
        fantasyName: 'DPA TEC',
        document: SEED_NFSE_CURL_PROVIDER_CNPJ,
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
        document: SEED_NFSE_CURL_PROVIDER_CNPJ,
        active: true,
      },
    });

    await prisma.$executeRawUnsafe(
      'SELECT setval(pg_get_serial_sequence(\'companies\', \'id\'), (SELECT MAX(id) FROM companies))',
    );

    const certFilePath = requireGissCertPath();

    await prisma.nfsProviderConfig.upsert({
      where: { companyId: SEED_NFSE_CURL_COMPANY_ID },
      create: {
        companyId: SEED_NFSE_CURL_COMPANY_ID,
        vendor: 'giss',
        municipalRegistration: '16895',
        municipalCodeIbge: '3529401',
        serieRps: 'NFSE',
        environment: NfsProviderEnvironment.Production,
        certFilePath,
        certPasswordEnvVar: 'GISS_CERT_PASSWORD',
        vendorConfig: { municipioSlug: 'maua' },
        municipalTaxCode: '620230001',
        issRate: 0.0387,
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
        municipalTaxCode: '620230001',
        issRate: 0.0387,
      },
    });

    // GISS rejeita RPS duplicado (E10). Sequência local costuma recomeçar em 1 após reset,
    // enquanto o GISS já consumiu números em testes anteriores. Piso alto evita colisão;
    // nota real 55363 usou RPS 73468 (série 1) — margem acima disso.
    const rpsSequenceFloor = 80_650;
    const existingSeq = await prisma.nfseRpsSequence.findUnique({
      where: { companyId: SEED_NFSE_CURL_COMPANY_ID },
      select: { nextId: true },
    });
    await prisma.nfseRpsSequence.upsert({
      where: { companyId: SEED_NFSE_CURL_COMPANY_ID },
      create: { companyId: SEED_NFSE_CURL_COMPANY_ID, nextId: rpsSequenceFloor },
      update: {
        nextId: Math.max(existingSeq?.nextId ?? 0, rpsSequenceFloor),
      },
    });
  }

  private static async ensureResale(prisma: PrismaClient): Promise<number> {
    const found = await prisma.resale.findFirst({ select: { id: true } });
    if (found) {
      return found.id;
    }

    const agg = await prisma.resale.aggregate({ _max: { id: true } });
    const id = (agg._max.id ?? 0) + 1;

    await prisma.resale.create({
      data: {
        id,
        type: 'PJ',
        name: `Revenda seed NFM ${id}`,
        identifier: null,
        zipCode: '01310100',
        street: 'Rua Seed NFM',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        licenseType: 'A1',
        document: id.toString().padStart(14, '0'),
        ie: null,
        phone01: '11999999999',
        phone02: null,
        voucher: null,
        email: null,
        website: null,
        receivesSupportEmail: false,
        servedByRoot: false,
        manufacturerResale: false,
        indicatorResale: false,
        recurringResale: false,
        active: true,
      },
    });

    return id;
  }

  private static async ensureBank(prisma: PrismaClient): Promise<number> {
    const bank = await prisma.bank.upsert({
      where: {
        // eslint-disable-next-line camelcase
        bankCode_agency_account: {
          bankCode: SEED_BANK_CODE,
          agency: SEED_BANK_AGENCY,
          account: SEED_BANK_ACCOUNT,
        },
      },
      create: {
        drawer: 'Seed NFM',
        wallet: 'Corrente',
        account: SEED_BANK_ACCOUNT,
        agency: SEED_BANK_AGENCY,
        bankCode: SEED_BANK_CODE,
        bankName: 'Banco Seed NFM',
        paymentLocation: null,
        active: true,
      },
      update: { active: true },
      select: { id: true },
    });
    return bank.id;
  }

  /** Correlação alinhada à NFS-e GISS 55363 (Mauá) — códigos que existem no cadastro do contribuinte. */
  private static readonly GISS_CURL_CORR = {
    cnaeCode: '6202-3/00',
    nbsCode: '1.1103.22.00',
    indopCode: '100501',
    serviceListItemCode: '01.05',
  } as const;

  private static readonly GISS_CURL_CORR_2 = {
    cnaeCode: '6201-5/01',
    nbsCode: '1.1103.22.00',
    indopCode: '100501',
    serviceListItemCode: '01.05',
  } as const;

  /** Dois ids distintos: `FindElegibleClients` emite um NFM por (cliente + cnaeNbsIndop). */
  private static async ensureCnaeNbsIndopPair(prisma: PrismaClient): Promise<[number, number]> {
    const firstId = await this.ensureGissCurlCnaeNbsIndop(prisma, this.GISS_CURL_CORR);
    const secondId = await this.ensureGissCurlCnaeNbsIndop(prisma, this.GISS_CURL_CORR_2);
    return [firstId, secondId];
  }

  private static async ensureGissCurlCnaeNbsIndop(
    prisma: PrismaClient,
    corr: { cnaeCode: string; nbsCode: string; indopCode: string; serviceListItemCode: string },
  ): Promise<number> {
    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.upsert({
        where: { code: corr.cnaeCode },
        create: {
          code: corr.cnaeCode,
          description: corr.cnaeCode === '6202-3/00'
            ? 'Desenvolvimento e licenciamento de programas de computador customizáveis'
            : 'Desenvolvimento de programas de computador sob encomenda',
          active: true,
        },
        update: { active: true },
        select: { id: true },
      }),
      prisma.nbs.upsert({
        where: { code: corr.nbsCode },
        create: {
          code: corr.nbsCode,
          description: 'Licenciamento de direito de uso de programas de computador',
          active: true,
        },
        update: { active: true },
        select: { id: true },
      }),
      prisma.indop.upsert({
        where: { code: corr.indopCode },
        create: {
          code: corr.indopCode,
          description: 'Operação de licenciamento / cessão de direito de uso de software',
          active: true,
        },
        update: { active: true },
        select: { id: true },
      }),
    ]);

    const row = await prisma.cnaeNbsIndop.upsert({
      where: {
        // eslint-disable-next-line camelcase
        cnaeId_nbsId_indopId: {
          cnaeId: cnae.id,
          nbsId: nbs.id,
          indopId: indop.id,
        },
      },
      create: {
        cnaeId: cnae.id,
        nbsId: nbs.id,
        indopId: indop.id,
        serviceListItemCode: corr.serviceListItemCode,
        active: true,
      },
      update: {
        serviceListItemCode: corr.serviceListItemCode,
        active: true,
      },
      select: { id: true },
    });

    return row.id;
  }
}

async function runStandalone(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await FindElegibleClientsNfmSeed.seed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void runStandalone();
}
