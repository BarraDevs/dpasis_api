import { Prisma, PrismaClient } from '@prisma/client';

export class ClientDepartmentSeed {
  private static data: Prisma.ClientDepartmentCreateInput[] = [
    { name: 'Administrativo', active: true },
    { name: 'Financeiro', active: true },
    { name: 'Comercial', active: true },
    { name: 'TI', active: true },
    { name: 'Recursos Humanos', active: true },
    { name: 'Compras', active: true },
    { name: 'Jurídico', active: true },
    { name: 'Diretoria', active: true },
    { name: 'Atendimento', active: true },
    { name: 'Suporte', active: true },
  ];

  static async seed(prisma: PrismaClient): Promise<void> {
    const clientDepartment = await prisma.clientDepartment.findFirst();
    if (clientDepartment) {
      return;
    }

    for (const data of this.data) {
      await prisma.clientDepartment.create({
        data,
      });
    }

    console.log('Client departments seeded');
  }
}
