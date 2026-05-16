import { Prisma, PrismaClient } from '@prisma/client';
import { ClientAddressType } from '../../src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigDueDateType } from '../../src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from '../../src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceType } from '../../src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from '../../src/app/client/client/domain/enums/client-type.enum';
import { ClientSequenceSeed } from './client-sequence';
import { ResaleSequenceSeed } from './resale-sequence';

/**
 * Cliente fixo para exercitar `FindElegibleClients` (NFM) e testar `GET /nfm` no Postman.
 * - `dueDateDay` = dia do mês de hoje (mesma regra que `new Date().getDate()` no use case).
 * - `emissionDay` = quando possível, ajustado para manter ao menos 15 dias até o vencimento (regra do domínio).
 * - Contrato + fatura + NF + ativo + itens ativos.
 * - `clientId` fixo: 9_500_001 — documento CNPJ de seed (`88.888.888/0001-88`).
 *
 * Se mudar o dia do calendário e a lista vier vazia, rode o seed de novo (`npm run db:seed`)
 * para atualizar `dueDateDay`. Use o mesmo fuso do servidor da API.
 *
 * Uso junto do seed principal (`index.ts`) ou isolado:
 *
 * ```bash
 * dotenv -e .env.development -- ts-node prisma/seeds/find-elegible-clients-nfm.ts
 * ```
 */
const SEED_CLIENT_ID = 9_500_001;
const SEED_CLIENT_DOCUMENT = '88.888.888/0001-88';
const SEED_GROUP_NAME = '__seed_nfm_elegivel_client_group';
const SEED_BANK_CODE = '__SEED_NFM__';
const SEED_BANK_AGENCY = '0001';
const SEED_BANK_ACCOUNT = '00000-0';

export class FindElegibleClientsNfmSeed {
  static async seed(prisma: PrismaClient): Promise<void> {
    const todayDueDay = new Date().getDate();
    /** Mantém `dueDateDay - emissionDay >= 15` quando `todayDueDay >= 16` (alinhado ao VO de vencimento). */
    const emissionDay = todayDueDay >= 16 ? todayDueDay - 15 : 1;

    const groupId = await this.ensureClientGroup(prisma);
    const resaleId = await this.ensureResale(prisma);
    const bankId = await this.ensureBank(prisma);
    const cnaeNbsIndopId = await this.ensureCnaeNbsIndop(prisma);

    const clientData: Prisma.ClientCreateInput = {
      id: SEED_CLIENT_ID,
      type: ClientType.PJ,
      document: SEED_CLIENT_DOCUMENT,
      ie: null,
      group: { connect: { id: groupId } },
      resale: { connect: { id: resaleId } },
      companyName: 'Cliente seed NFM elegível',
      fantasyName: 'NFM Elegível',
      headquarters: 'Matriz',
      invoiceType: ClientInvoiceType.CONTRACT,
      generateInvoice: true,
      active: true,
    };

    await prisma.client.upsert({
      where: { id: SEED_CLIENT_ID },
      create: clientData,
      update: {
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
        document: SEED_CLIENT_DOCUMENT,
        group: { connect: { id: groupId } },
        resale: { connect: { id: resaleId } },
      },
    });

    const billingAddress = await prisma.clientAddress.upsert({
      where: {
        // eslint-disable-next-line camelcase
        clientId_type: {
          clientId: SEED_CLIENT_ID,
          type: ClientAddressType.BILLING,
        },
      },
      create: {
        clientId: SEED_CLIENT_ID,
        type: ClientAddressType.BILLING,
        zipCode: '01310-100',
        street: 'Av. Paulista',
        number: '1000',
        complement: 'Seed NFM',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        active: true,
      },
      update: { active: true },
    });

    await prisma.clientInvoiceConfig.upsert({
      where: { clientId: SEED_CLIENT_ID },
      create: {
        clientId: SEED_CLIENT_ID,
        generateNf: true,
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: todayDueDay,
        dueMonth: null,
        deadlineDays: null,
        months: [],
        billingAddressId: billingAddress.id,
        bankId,
        autoProtestBoleto: false,
        message: 'Configuração de teste — FindElegibleClients (NFM)',
      },
      update: {
        generateNf: true,
        emissionDay,
        dueDateDay: todayDueDay,
        billingAddressId: billingAddress.id,
        bankId,
      },
    });

    await prisma.clientItem.deleteMany({ where: { clientId: SEED_CLIENT_ID } });
    await prisma.clientItem.createMany({
      data: [
        {
          clientId: SEED_CLIENT_ID,
          description: 'Item seed NFM — serviço mensal',
          quantity: 1,
          unitValueInCents: 10000,
          cnaeNbsIndopId,
          active: true,
        },
        {
          clientId: SEED_CLIENT_ID,
          description: 'Item seed NFM — manutenção',
          quantity: 2,
          unitValueInCents: 5000,
          cnaeNbsIndopId,
          active: true,
        },
      ],
    });

    await ClientSequenceSeed.seed(prisma);
    await ResaleSequenceSeed.seed(prisma);

    console.log(
      `[FindElegibleClientsNfmSeed] Pronto — clientId=${SEED_CLIENT_ID}, dueDateDay=${todayDueDay} (hoje).`,
    );
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

  private static async ensureCnaeNbsIndop(prisma: PrismaClient): Promise<number> {
    const existing = await prisma.cnaeNbsIndop.findFirst({ select: { id: true } });
    if (existing) {
      return existing.id;
    }

    const u = String(Date.now()).slice(-6);

    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({
        data: { code: `NFMC${u}`, description: 'CNAE seed NFM', active: true },
      }),
      prisma.nbs.create({
        data: { code: `NFMN${u}`, description: 'NBS seed NFM', active: true },
      }),
      prisma.indop.create({
        data: { code: `NFMI${u}`, description: 'INDOP seed NFM', active: true },
      }),
    ]);

    const row = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id, active: true },
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
