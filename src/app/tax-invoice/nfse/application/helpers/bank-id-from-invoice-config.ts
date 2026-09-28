import { FindClientInvoiceConfigByClientId } from 'src/app/client/client-invoice-config/application/usecases/find-client-invoice-config-by-client-id/find-client-invoice-config-by-client-id.service';
import { BankIntegrationNotConfiguredError } from 'src/app/global/bank/domain/errors/bank-integration-not-configured.error';

export async function bankIdFromClientInvoiceConfig(
  findClientInvoiceConfigByClientId: FindClientInvoiceConfigByClientId,
  clientId: number,
): Promise<number> {
  const invoiceConfig = await findClientInvoiceConfigByClientId.execute(clientId);
  if (!invoiceConfig?.bank?.id) {
    throw new BankIntegrationNotConfiguredError();
  }

  return invoiceConfig.bank.id;
}
