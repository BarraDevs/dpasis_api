import { Inject, Injectable } from '@nestjs/common';
import { FindBankById } from 'src/app/global/bank/application/usecases/find-bank-by-id/find-bank-by-id.service';
import { FindProviderById } from 'src/app/provider/provider/application/usecases/find-provider-by-id/find-provider-by-id.service';
import { ProviderItemFactory } from 'src/app/provider/provider-item/domain/factories/provider-item.factory';
import { TOKENS } from 'src/core/di/token';
import type { IProviderItemRepository } from '../../persistence/repository/provider-item-repository.interface';
import { CreateProviderItemInputDto, CreateProviderItemOutputDto } from './dtos/create-provider-item.dto';

@Injectable()
export class CreateProviderItem {
  constructor(
    @Inject(TOKENS.ProviderItemRepository) private readonly providerItemRepository: IProviderItemRepository,
    private readonly findProviderById: FindProviderById,
    private readonly findBankById: FindBankById,
  ) {}

  public async execute(data: CreateProviderItemInputDto): Promise<CreateProviderItemOutputDto> {
    await this.findProviderById.execute(data.providerId);
    await this.findBankById.execute(data.bankId, { onlyActive: true });

    const entity = ProviderItemFactory.create({
      providerId: data.providerId,
      description: data.description,
      totalValueInCents: data.totalValueInCents,
      installmentsCount: data.installmentsCount,
      scheduleType: data.scheduleType,
      intervalDays: data.intervalDays ?? null,
      dueDay: data.dueDay ?? null,
      firstDueDate: new Date(data.firstDueDate),
      bankId: data.bankId,
    });

    const id = await this.providerItemRepository.save(entity);

    return { id };
  }
}
