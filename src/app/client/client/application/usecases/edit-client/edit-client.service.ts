import { Inject, Injectable } from '@nestjs/common';
import { FindClientGroupById } from 'src/app/client/client-group/application/usecases/find-client-group-by-id/find-client-group-by-id.service';
import { FindResaleById } from 'src/app/resale/resale/application/usecases/find-resale-by-id/find-resale-by-id.service';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { FindHonorificById } from 'src/app/global/honorific/application/usecases/find-honorific-by-id/find-honorific-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientNotFoundError } from '../../../domain/errors/client-not-found.error';
import { ClientFactory } from '../../../domain/factories/client.factory';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';
import { EditClientInputDto } from './dtos/edit-client.dto';

@Injectable()
export class EditClient {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
    @Inject(TOKENS.ClientRepository) private readonly clientRepository: IClientRepository,
    private readonly findClientGroupById: FindClientGroupById,
    private readonly findResaleById: FindResaleById,
    private readonly findCompanyById: FindCompanyById,
    private readonly findHonorificById: FindHonorificById,
  ) {}

  public async execute(id: number, data: EditClientInputDto): Promise<SuccessMessage> {
    const client = await this.clientDao.findById(id);
    if (!client) {
      throw new ClientNotFoundError();
    }

    const companyIds =
      data.companyIds !== undefined ? data.companyIds : (client.companies ?? []).map((c) => c.id);

    const honorificId =
      data.honorificId !== undefined ? data.honorificId : (client.honorific?.id ?? null);

    const clientEntity = ClientFactory.edit({
      ...client,
      ...data,
      id,
      groupId: data.groupId ?? client.group.id,
      resaleId: data.resaleId ?? client.resale.id,
      honorificId,
      companyIds,
      type: client.type as ClientType,
      invoiceType: client.invoiceType as ClientInvoiceType,
    });

    if (data.groupId) {
      await this.findClientGroupById.execute(data.groupId, { onlyActive: true });
    }
    if (data.resaleId) {
      await this.findResaleById.execute(data.resaleId!, { onlyActive: true });
    }
    if (data.companyIds) {
      for (const companyId of data.companyIds) {
        await this.findCompanyById.execute(companyId, { onlyActive: true });
      }
    }

    if (data.honorificId !== undefined && data.honorificId != null) {
      await this.findHonorificById.execute(data.honorificId, { onlyActive: true });
    }

    await this.clientRepository.edit(clientEntity);

    return { message: 'Edição realizada com sucesso' };
  }
}
