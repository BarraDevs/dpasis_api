import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ILocalSecureFileGateway } from 'src/infra/local-secure-file/local-secure-file.gateway';
import { hasAnyPositiveReference } from 'src/shared/helpers/has-any-positive-reference';
import { BankInUseError } from '../../../domain/errors/bank-in-use.error';
import { BankNotFoundError } from '../../../domain/errors/bank-not-found.error';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';

@Injectable()
export class DeleteBank {
  constructor(
    @Inject(TOKENS.BankDao) private readonly dao: IBankDao,
    @Inject(TOKENS.LocalSecureFileGateway) private readonly localSecureFile: ILocalSecureFileGateway,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const existing = await this.dao.findById(id);
    if (!existing) {
      throw new BankNotFoundError();
    }

    const inUse = await hasAnyPositiveReference([
      () => this.dao.countClientInvoiceConfigsByBankId(id),
    ]);
    if (inUse) {
      throw new BankInUseError();
    }

    await this.dao.delete(id);
    await this.localSecureFile.deleteDirectory(String(id));
    return { message: 'Banco excluído com sucesso.' };
  }
}
