import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { ISecretsCryptoGateway } from 'src/infra/secrets-crypto/secrets-crypto.gateway';
import { BankAlreadyExistsError } from '../../../domain/errors/bank-already-exists.error';
import { encryptBankSecrets } from '../../helpers/encrypt-bank-secrets';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';
import { CreateBankInputDto, CreateBankOutputDto } from './dtos/create-bank.dto';

@Injectable()
export class CreateBank {
  constructor(
    @Inject(TOKENS.BankDao) private readonly dao: IBankDao,
    @Inject(TOKENS.SecretsCryptoGateway) private readonly secretsCrypto: ISecretsCryptoGateway,
  ) {}

  public async execute(data: CreateBankInputDto): Promise<CreateBankOutputDto> {
    const existing = await this.dao.findByBankCodeAgencyAccount(
      data.bankCode,
      data.agency,
      data.account,
    );
    if (existing) {
      throw new BankAlreadyExistsError(
        data.bankCode,
        data.agency,
        data.account,
      );
    }

    const { persistence, generatedWebhookToken } = encryptBankSecrets(this.secretsCrypto, data, {
      generateWebhookIfMissing: true,
    });

    const id = await this.dao.save({
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

    return {
      id,
      ...(generatedWebhookToken || data.webhookToken
        ? { webhookToken: generatedWebhookToken ?? data.webhookToken }
        : {}),
    };
  }
}
