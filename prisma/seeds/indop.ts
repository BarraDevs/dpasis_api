import { Prisma, PrismaClient } from '@prisma/client';

/**
 * INDOP - Indicadores de Operações de Consumo (cIndOp)
 * Conforme Lei Complementar nº 214/2025 e Anexo VII do Portal NFSe Nacional
 * Fonte: https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica
 */
export class IndopSeed {
  private static data: Prisma.IndopCreateInput[] = [
    { code: '020101', description: 'Prestação de serviço no estabelecimento do prestador', active: true },
    { code: '020201', description: 'Prestação de serviço no estabelecimento do tomador', active: true },
    { code: '020301', description: 'Prestação de serviço em outro local', active: true },
    { code: '030101', description: 'Operação com entrega no estabelecimento do prestador', active: true },
    { code: '030102', description: 'Operação com entrega no estabelecimento do tomador', active: true },
    { code: '030103', description: 'Operação com entrega em outro local', active: true },
    { code: '030104', description: 'Operação sem entrega (intangível)', active: true },
    { code: '040101', description: 'Operação de consumo no estabelecimento', active: true },
    { code: '050101', description: 'Prestação de serviço de transporte - origem e destino no Brasil', active: true },
    { code: '050102', description: 'Prestação de serviço de transporte - origem ou destino no exterior', active: true },
    { code: '050103', description: 'Prestação de serviço de transporte - origem e destino no exterior', active: true },
    { code: '050104', description: 'Prestação de serviço de transporte - interestadual', active: true },
    { code: '050201', description: 'Prestação de serviço de transporte aéreo', active: true },
    { code: '060101', description: 'Operação de serviço prestado no Brasil', active: true },
    { code: '070101', description: 'Operação de serviço de hospedagem', active: true },
    { code: '070102', description: 'Operação de serviço de alimentação', active: true },
    { code: '080101', description: 'Operação de serviço de locação', active: true },
    { code: '100101', description: 'Operação de serviço de construção', active: true },
    { code: '100102', description: 'Operação de serviço de reforma', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const indop = await prisma.indop.findFirst();
    if (indop) {
      return;
    }

    for (const data of this.data) {
      await prisma.indop.create({
        data,
      });
    }

    console.log('INDOPs seeded');
  }
}
