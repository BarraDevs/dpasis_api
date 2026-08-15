import { PrismaClient } from '@prisma/client';

/**
 * Correlação CNAE + NBS + INDOP
 * Combina classificações para uso em itens de serviço e NFSe
 * Baseado em correlações típicas do Anexo VIII - Portal NFSe Nacional
 */
export class CnaeNbsIndopSeed {
  static async seed(prisma: PrismaClient): Promise<void> {
    const cnaeNbsIndop = await prisma.cnaeNbsIndop.findFirst();
    if (cnaeNbsIndop) {
      return;
    }

    const cnaes = await prisma.cnae.findMany({ select: { id: true, code: true } });
    const nbss = await prisma.nbs.findMany({ select: { id: true, code: true } });
    const indops = await prisma.indop.findMany({ select: { id: true, code: true } });

    if (cnaes.length === 0 || nbss.length === 0 || indops.length === 0) {
      console.log('CnaeNbsIndop: Skipping - CNAE, NBS or INDOP not seeded');
      return;
    }

    const correlations = [
      { cnaeCode: '6201-5/01', nbsCode: '1.0201.10.00', indopCode: '060101', serviceListItemCode: '01.07' },
      { cnaeCode: '6204-0/00', nbsCode: '1.0201.20.00', indopCode: '060101', serviceListItemCode: '01.07' },
      { cnaeCode: '6209-1/01', nbsCode: '1.0201.30.00', indopCode: '060101', serviceListItemCode: '01.07' },
      { cnaeCode: '6201-5/01', nbsCode: '1.0601.20.00', indopCode: '020101', serviceListItemCode: '01.07' },
      { cnaeCode: '7020-4/00', nbsCode: '1.0601.10.00', indopCode: '020201', serviceListItemCode: '01.07' },
      { cnaeCode: '7319-0/04', nbsCode: '1.0701.10.00', indopCode: '060101', serviceListItemCode: '01.07' },
      { cnaeCode: '4120-4/00', nbsCode: '1.0101.30.00', indopCode: '100101', serviceListItemCode: '01.07' },
      { cnaeCode: '4120-4/00', nbsCode: '1.0107.30.00', indopCode: '100102', serviceListItemCode: '01.07' },
      { cnaeCode: '4923-0/02', nbsCode: '1.1001.10.00', indopCode: '050101', serviceListItemCode: '01.07' },
      { cnaeCode: '5611-2/04', nbsCode: '1.1101.10.00', indopCode: '070102', serviceListItemCode: '01.07' },
      { cnaeCode: '8610-1/01', nbsCode: '1.0801.10.00', indopCode: '020101', serviceListItemCode: '01.07' },
      { cnaeCode: '8511-2/00', nbsCode: '1.0901.10.00', indopCode: '020201', serviceListItemCode: '01.07' },
      { cnaeCode: '8299-9/99', nbsCode: '1.0601.10.00', indopCode: '060101', serviceListItemCode: '01.07' },
    ];

    for (const corr of correlations) {
      const cnae = cnaes.find((c) => c.code === corr.cnaeCode);
      const nbs = nbss.find((n) => n.code === corr.nbsCode);
      const indop = indops.find((i) => i.code === corr.indopCode);

      if (cnae && nbs && indop) {
        await prisma.cnaeNbsIndop.upsert({
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
          },
          update: {},
        });
      }
    }

    console.log('CNAE-NBS-INDOP correlations seeded');
  }
}
