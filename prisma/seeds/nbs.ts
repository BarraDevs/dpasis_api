import { Prisma, PrismaClient } from '@prisma/client';

/**
 * NBS 2.0 - Nomenclatura Brasileira de Serviços (MDIC)
 * Dados oficiais conforme Portarias nº 1.429/2018 e 2.000/2018
 * Fonte: https://www.gov.br/mdic/pt-br/assuntos/comercio-e-servicos/nbs-nomenclatura-brasileira-de-servicos
 */
export class NbsSeed {
  private static data: Prisma.NbsCreateInput[] = [
    { code: '1.0101.30.00', description: 'Serviços de construção de edificações de uso misto (residencial e não residencial)', active: true },
    { code: '1.0103.41.00', description: 'Serviços de perfuração de poços de água', active: true },
    { code: '1.0107.30.00', description: 'Serviços de pintura', active: true },
    { code: '1.0201.10.00', description: 'Serviços de desenvolvimento de programas de computador sob encomenda', active: true },
    { code: '1.0201.20.00', description: 'Serviços de consultoria em tecnologia da informação', active: true },
    { code: '1.0201.30.00', description: 'Serviços de suporte técnico em tecnologia da informação', active: true },
    { code: '1.0401.21.20', description: 'Serviços de transporte aquaviário local de passageiros', active: true },
    { code: '1.0501.10.00', description: 'Serviços de intermediação em compras, vendas e aluguel de imóveis', active: true },
    { code: '1.0601.10.00', description: 'Serviços de assessoria ou consultoria de qualquer natureza', active: true },
    { code: '1.0601.20.00', description: 'Serviços de análise, programação, instalação, configuração e outros serviços de informática', active: true },
    { code: '1.0701.10.00', description: 'Serviços de publicidade e propaganda', active: true },
    { code: '1.0801.10.00', description: 'Serviços de atendimento médico e odontológico', active: true },
    { code: '1.0901.10.00', description: 'Serviços de ensino', active: true },
    { code: '1.1001.10.00', description: 'Serviços de transporte de cargas', active: true },
    { code: '1.1101.10.00', description: 'Serviços de fornecimento de alimentação, bebidas e congêneres', active: true },
    { code: '1.1103.22.00', description: 'Licenciamento de direito de uso de programas de computador', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const nbs = await prisma.nbs.findFirst();
    if (nbs) {
      return;
    }

    for (const data of this.data) {
      await prisma.nbs.create({
        data,
      });
    }

    console.log('NBSs seeded');
  }
}
