import { Prisma, PrismaClient } from '@prisma/client';

export class DepartmentSeed {
  private static data: Prisma.DepartmentCreateInput[] = [
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
    const department = await prisma.department.findFirst();
    if (department) {
      return;
    }

    for (const data of this.data) {
      await prisma.department.create({
        data,
      });
    }

    console.log('Departments seeded');
  }
}
