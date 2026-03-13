import { PrismaClient } from '@prisma/client';

export class ClientAttachmentSeed {
  static async seed(prisma: PrismaClient): Promise<void> {
    const clientAttachment = await prisma.clientAttachment.findFirst();
    if (clientAttachment) {
      return;
    }

    const clients = await prisma.client.findMany({ select: { id: true } });

    if (clients.length === 0) {
      console.log('ClientAttachment: Skipping - no clients seeded');
      return;
    }

    const attachmentData = [
      { description: 'Contrato de prestação de serviços', link: 'https://example.com/contrato-cliente1.pdf' },
      { description: 'Nota fiscal modelo', link: 'https://example.com/nf-modelo.pdf' },
      { description: 'Documentação técnica', link: 'https://example.com/docs-tecnicos.pdf' },
    ];

    for (let i = 0; i < Math.min(clients.length, attachmentData.length); i++) {
      const client = clients[i];
      const att = attachmentData[i];
      await prisma.clientAttachment.create({
        data: {
          clientId: client.id,
          description: att.description,
          link: att.link,
          active: true,
        },
      });
    }

    console.log('Client attachments seeded');
  }
}
