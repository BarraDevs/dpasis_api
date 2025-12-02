import { Inject, Injectable } from '@nestjs/common';
import { SupplierNotFoundError } from 'src/app/supplier/domain/errors/supplier-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ISupplierRepository } from '../../persistence/repository/supplier-repository.interface';

@Injectable()
export class UpdateSupplierStatus {
  constructor(
    @Inject(TOKENS.SupplierRepository) private supplierRepository: ISupplierRepository,
  ) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const supplier = await this.supplierRepository.findById(id);
    if (!supplier) {
      throw new SupplierNotFoundError();
    }

    supplier.toggleStatus();
    await this.supplierRepository.edit(supplier);

    return { message: 'Status atualizado com sucesso.' };
  }
}
