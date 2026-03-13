import { Prisma, PrismaClient } from '@prisma/client';

/**
 * CNAE 2.3 - Classificação Nacional de Atividades Econômicas (IBGE)
 * Dados oficiais conforme Resolução CONCLA nº 01/2018
 * Fonte: https://cnae.ibge.gov.br/
 */
export class CnaeSeed {
  private static data: Prisma.CnaeCreateInput[] = [
    { code: '6201-5/01', description: 'Desenvolvimento de programas de computador sob encomenda', active: true },
    { code: '6202-3/00', description: 'Desenvolvimento e licenciamento de programas de computador customizáveis', active: true },
    { code: '6204-0/00', description: 'Consultoria em tecnologia da informação', active: true },
    { code: '6209-1/01', description: 'Suporte técnico, manutenção e outros serviços em tecnologia da informação', active: true },
    { code: '5611-2/04', description: 'Bares sem entretenimento', active: true },
    { code: '4713-0/04', description: 'Lojas de departamentos ou magazines (exceto duty free)', active: true },
    { code: '4541-2/06', description: 'Comércio a varejo de peças e acessórios novos para motocicletas', active: true },
    { code: '1610-2/03', description: 'Serrarias com desdobramento de madeira em bruto', active: true },
    { code: '4120-4/00', description: 'Construção de edifícios', active: true },
    { code: '7020-4/00', description: 'Atividades de consultoria em gestão empresarial', active: true },
    { code: '8299-9/99', description: 'Outras atividades de serviços prestados principalmente às empresas não especificadas anteriormente', active: true },
    { code: '7319-0/04', description: 'Agências de publicidade', active: true },
    { code: '8610-1/01', description: 'Atividades de atendimento hospitalar', active: true },
    { code: '8511-2/00', description: 'Ensino fundamental', active: true },
    { code: '4923-0/02', description: 'Transporte rodoviário de carga', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const cnae = await prisma.cnae.findFirst();
    if (cnae) {
      return;
    }

    for (const data of this.data) {
      await prisma.cnae.create({
        data,
      });
    }

    console.log('CNAEs seeded');
  }
}
