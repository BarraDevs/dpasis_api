import { Injectable } from '@nestjs/common';
import { SearchClient } from 'src/app/client/client/application/usecases/search-client/search-client.service';
import { FindAllClientInvoiceConfig } from 'src/app/client/client-invoice-config/application/usecases/find-all-client-invoice-config/find-all-client-invoice-config.service';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { FindAllClientItem } from 'src/app/client/client-item/application/usecases/find-all-client-item/find-all-client-item.service';
import { ClientItemDto } from 'src/app/client/client-item/application/dtos/client-item.dto';
import { NfmDto } from '../../dtos/nfm.dto';

@Injectable()
export class FindElegibleClients {
  constructor(
    private readonly searchClient: SearchClient,
    private readonly findAllClientInvoiceConfig: FindAllClientInvoiceConfig,
    private readonly findAllClientItem: FindAllClientItem,
  ) {}

  public async execute(): Promise<NfmDto[]> {
    const today = new Date().getDate();

    // search all clients with invoice config where:
    // - due date day equal to today
    // - generate nf is true
    const invoices = await this.findAllClientInvoiceConfig.execute({
      dueDateDay: today,
      generateNf: true,
    });

    // search all clients from invoices where:
    // - invoice type is contract
    // - active is true
    // - generate invoice is true
    const clients = await this.searchClient.execute({
      filter: {
        id: {
          in: invoices.data.map(invoice => invoice.clientId),
        },
        invoiceType: {
          eq: ClientInvoiceType.CONTRACT,
        },
        active: {
          eq: true,
        },
        generateInvoice: {
          eq: true,
        },
      },
    });

    // search all items from clients where:
    // - active is true
    const clientItems = new Map<number, ClientItemDto[]>();
    for await (const client of clients.data) {
      const items = await this.findAllClientItem.execute({
        clientId: client.id,
        active: true,
      });
      if (items.data.length > 0) {
        clientItems.set(client.id, items.data);
      }
    }

    // filter clients with active items and client invoice config
    const nfms: NfmDto[] = [];
    for (const client of clients.data) {
      const clientInvoiceConfig = invoices.data.find(invoice => invoice.clientId === client.id);
      const items = clientItems.get(client.id) ?? [];

      if (!clientInvoiceConfig || items.length === 0) {
        continue;
      }

      nfms.push({
        client,
        clientInvoiceConfig,
        clientItems: items,
      });
    }

    return nfms;
  }
}
