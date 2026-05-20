import { PrismaClient } from '@prisma/client';

export class ClientContactSeed {
  static async seed(prisma: PrismaClient): Promise<void> {
    const clientContact = await prisma.clientContact.findFirst();
    if (clientContact) {
      return;
    }

    const [clients, departments] = await Promise.all([
      prisma.client.findMany({ select: { id: true } }),
      prisma.department.findMany({ select: { id: true, name: true } }),
    ]);

    if (clients.length === 0 || departments.length === 0) {
      console.log('ClientContact: Skipping - no clients or departments seeded');
      return;
    }

    const adminDept = departments.find((d) => d.name === 'Administrativo') ?? departments[0];
    const financeDept = departments.find((d) => d.name === 'Financeiro') ?? departments[1] ?? departments[0];
    const commercialDept = departments.find((d) => d.name === 'Comercial') ?? departments[2] ?? departments[0];

    const contactData = [
      { clientIdx: 0, dept: adminDept, name: 'Maria Silva', email: 'maria.silva@cliente.com', phone: '1133334444', whatsapp: '11999998888', receiveNF: true },
      { clientIdx: 0, dept: financeDept, name: 'Pedro Santos', email: 'pedro.santos@cliente.com', phone: '1133335555', receiveNF: true },
      { clientIdx: 1, dept: commercialDept, name: 'Ana Oliveira', email: 'ana.oliveira@techcliente.com', receiveNF: true },
      { clientIdx: 2, dept: adminDept, name: 'João da Silva', email: 'joao.silva@email.com', phone: '11988887777', receiveNF: false },
    ];

    for (const c of contactData) {
      if (clients[c.clientIdx]) {
        await prisma.clientContact.upsert({
          where: {
            // eslint-disable-next-line camelcase
            clientId_email: {
              clientId: clients[c.clientIdx].id,
              email: c.email,
            },
          },
          create: {
            clientId: clients[c.clientIdx].id,
            active: true,
            departmentId: c.dept.id,
            name: c.name,
            email: c.email,
            phone: c.phone ?? null,
            whatsapp: c.whatsapp ?? null,
            receiveNF: c.receiveNF,
          },
          update: {},
        });
      }
    }

    console.log('Client contacts seeded');
  }
}
