import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
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
    // Dia no fuso de Brasília, não o do relógio do servidor: em UTC, todo dia entre 21h e 00h o
    // faturamento enxergaria o dia seguinte.
    const today = DateTime.now().setZone(SAO_PAULO_TIMEZONE).day;

    // search all clients with invoice config where:
    // - due date day is today or already past in the current month
    // - generate nf is true
    //
    // O filtro era igualdade com o dia de hoje: um dia sem execução — feriado, férias, esquecimento —
    // deixava aqueles contratos sem faturar, e no dia seguinte eles não voltavam mais a aparecer. Com
    // `<=`, a competência atrasada entra na varredura do dia seguinte; a `@@unique` da NFM
    // (cliente + competência + cnae) é o que garante que ela não seja emitida duas vezes.
    const invoices = await this.findAllClientInvoiceConfig.execute({
      dueDateDayMax: today,
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

    // one NfmDto per (client + cnaeNbsIndop) group
    const nfms: NfmDto[] = [];
    for (const client of clients.data) {
      const clientInvoiceConfig = invoices.data.find(invoice => invoice.clientId === client.id);
      const items = clientItems.get(client.id) ?? [];

      if (!clientInvoiceConfig || items.length === 0) {
        continue;
      }

      const groups = new Map<number, ClientItemDto[]>();
      for (const item of items) {
        const groupId = item.cnaeNbsIndop.id;
        const groupItems = groups.get(groupId) ?? [];
        groupItems.push(item);
        groups.set(groupId, groupItems);
      }

      for (const groupItems of groups.values()) {
        nfms.push({
          client,
          clientInvoiceConfig,
          clientItems: groupItems,
        });
      }
    }

    return nfms;
  }
}
