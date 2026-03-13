import { Prisma, PrismaClient } from '@prisma/client';

export class CompanySeed {
  private static data: Prisma.CompanyCreateInput[] = [
    {
      name: 'Empresa Exemplo Ltda',
      fantasyName: 'Exemplo',
      document: '12.345.678/0001-90',
      ie: '123.456.789.012',
      active: true,
      zipCode: '01310-100',
      street: 'Avenida Paulista',
      number: '1000',
      complement: 'Sala 101',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      phone01: '1133334444',
      phone02: '1133335555',
      cellphone: '11999998888',
      email01: 'contato@exemplo.com.br',
      email02: 'financeiro@exemplo.com.br',
    },
    {
      name: 'Tech Solutions S.A.',
      fantasyName: 'TechSol',
      document: '98.765.432/0001-10',
      active: true,
      zipCode: '04543-907',
      street: 'Avenida Engenheiro Luís Carlos Berrini',
      number: '500',
      neighborhood: 'Itaim Bibi',
      city: 'São Paulo',
      state: 'SP',
      phone01: '1144445555',
      cellphone: '11988887777',
      email01: 'contato@techsol.com.br',
    },
    {
      name: 'Serviços Gerais ME',
      fantasyName: 'ServGerais',
      document: '11.222.333/0001-44',
      ie: '111.222.333.444',
      active: true,
      zipCode: '30130-100',
      street: 'Avenida Afonso Pena',
      number: '1500',
      neighborhood: 'Centro',
      city: 'Belo Horizonte',
      state: 'MG',
      phone01: '3133334444',
      email01: 'contato@servgerais.com.br',
    },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const company = await prisma.company.findFirst();
    if (company) {
      return;
    }

    for (const data of this.data) {
      await prisma.company.create({
        data,
      });
    }

    console.log('Companies seeded');
  }
}
