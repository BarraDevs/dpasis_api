import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ISecretsCryptoGateway } from 'src/infra/secrets-crypto/secrets-crypto.gateway';
import { BankAlreadyExistsError } from '../../../domain/errors/bank-already-exists.error';
import { BankNotFoundError } from '../../../domain/errors/bank-not-found.error';
import { encryptBankSecrets } from '../../helpers/encrypt-bank-secrets';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';
import { EditBankInputDto } from './dtos/edit-bank.dto';

@Injectable()
export class EditBank {
  constructor(
    @Inject(TOKENS.BankDao) private readonly dao: IBankDao,
    @Inject(TOKENS.SecretsCryptoGateway) private readonly secretsCrypto: ISecretsCryptoGateway,
  ) {}

  public async execute(id: number, data: EditBankInputDto): Promise<SuccessMessage> {
    const bank = await this.dao.findById(id);
    if (!bank) {
      throw new BankNotFoundError();
    }

    const existing = await this.dao.findByBankCodeAgencyAccount(
      data.bankCode,
      data.agency,
      data.account,
    );
    if (existing && existing.id !== id) {
      throw new BankAlreadyExistsError(
        data.bankCode,
        data.agency,
        data.account,
      );
    }

    const { persistence } = encryptBankSecrets(this.secretsCrypto, data, {
      generateWebhookIfMissing: false,
    });

    await this.dao.edit(id, {
      drawer: data.drawer,
      wallet: data.wallet,
      account: data.account,
      agency: data.agency,
      bankCode: data.bankCode,
      bankName: data.bankName,
      paymentLocation: data.paymentLocation,
      fineRate: data.fineRate,
      moraRate: data.moraRate,
      ...persistence,
    });

    return { message: 'Banco atualizado com sucesso' };
  }
}
