import { CNPJ } from '../cnpj/cnpj.vo';
import { CPF } from '../cpf/cpf.vo';
import { InvalidDocumentError } from './document.error';

export class Document {
  private readonly CPF_LENGTH = 11;
  private readonly CNPJ_LENGTH = 14;
  private readonly _value: string;

  public get value(): string {
    return this._value;
  }

  constructor(raw: string) {
    const document = this.sanitize(raw);

    if (document.length === this.CPF_LENGTH) {
      this._value = new CPF(document).value;
    }
    else if (document.length === this.CNPJ_LENGTH) {
      this._value = new CNPJ(document).value;
    }
    else {
      throw new InvalidDocumentError();
    }
  }

  private sanitize(cnpj: string): string {
    return cnpj?.replace(/[\s./-]*/gim, '');
  }
}
