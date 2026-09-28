import type { TestingModule } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { seedConfiguredBank } from './seed-configured-bank';

/**
 * Liga um cliente já persistido a um banco com credenciais de integração.
 * Emissão, consulta e cancelamento de boleto resolvem o banco por esta config.
 */
export async function seedClientInvoiceConfig(
  module: TestingModule,
  clientId: number,
  charges?: { fineRate?: number | null; moraRate?: number | null },
): Promise<{ bankId: number }> {
  const prisma = module.get(PrismaService);
  const { bankId } = await seedConfiguredBank(module);

  if (charges) {
    await prisma.bank.update({
      where: { id: bankId },
      data: {
        ...(charges.fineRate !== undefined ? { fineRate: charges.fineRate } : {}),
        ...(charges.moraRate !== undefined ? { moraRate: charges.moraRate } : {}),
      },
    });
  }

  const billingAddress = await prisma.clientAddress.create({
    data: {
      clientId,
      type: ClientAddressType.BILLING,
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '500',
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      cityCodeIbge: '3550308',
      state: 'SP',
      active: true,
    },
  });

  await prisma.clientInvoiceConfig.create({
    data: {
      clientId,
      generateNf: true,
      type: ClientInvoiceConfigType.MONTHLY,
      emissionDay: 5,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      dueDateDay: 15,
      dueMonth: null,
      deadlineDays: null,
      months: [],
      billingAddressId: billingAddress.id,
      bankId,
      autoProtestBoleto: false,
      issWithheld: false,
      message: null,
    },
  });

  return { bankId };
}
