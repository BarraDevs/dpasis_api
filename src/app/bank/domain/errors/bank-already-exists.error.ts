import { AppException } from 'src/core/filters/app.exception';

export class BankAlreadyExistsError extends AppException {
  constructor(bankCode: string, agency: string, account: string) {
    super(
      `Já existe um banco com código ${bankCode}, agência ${agency} e conta ${account}.`,
      409,
    );
    this.name = 'BankAlreadyExistsError';
  }
}
