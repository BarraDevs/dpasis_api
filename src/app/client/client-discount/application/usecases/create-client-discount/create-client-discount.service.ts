import { Inject, Injectable } from '@nestjs/common';
import { ClientDiscountFactory } from 'src/app/client/client-discount/domain/factories/client-discount.factory';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { TOKENS } from 'src/core/di/token';
import type { IClientDiscountRepository } from '../../persistence/repository/client-discount-repository.interface';
import { CreateClientDiscountInputDto, CreateClientDiscountOutputDto } from './dtos/create-client-discount.dto';

@Injectable()
export class CreateClientDiscount {
  constructor(
    @Inject(TOKENS.ClientDiscountRepository) private readonly clientDiscountRepository: IClientDiscountRepository,
    private readonly findClientById: FindClientById,
  ) {}

  public async execute(data: CreateClientDiscountInputDto): Promise<CreateClientDiscountOutputDto> {
    const client = await this.findClientById.execute(data.clientId, { onlyActive: true });

    const entity = ClientDiscountFactory.create({
      clientId: client.id,
      description: data.description,
      type: data.type,
      discountValue: data.discountValue,
      month: data.month,
      year: data.year,
      doNotGenerateCharge: data.doNotGenerateCharge,
      terminateContract: data.terminateContract,
    });

    const id = await this.clientDiscountRepository.save(entity);

    return { id };
  }
}
