import { AppException } from 'src/core/filters/app.exception';

/**
 * O provedor recusou a emissão porque a cobrança já existe, e devolveu o identificador dela.
 *
 * O Inter monta uma chave de idempotência implícita com `seuNumero` + `valorNominal` +
 * `dataVencimento` + `cpfCnpj` do pagador, válida por 30 minutos. Dentro dessa janela, a segunda
 * chamada é recusada com HTTP 400 — e a mensagem traz o `codigoSolicitacao` da cobrança emitida.
 *
 * Existe como classe própria porque o 400 do Inter não é uma coisa só: uma validação de payload é
 * permanente e não gerou cobrança, enquanto esta recusa significa que a cobrança **existe** e o
 * caminho certo é vinculá-la, não descartá-la. A diferença está no corpo, não no status.
 */
export class BankPaymentAlreadyExistsError extends AppException {
  public readonly requestCode: string;

  constructor(requestCode: string, message?: string) {
    super(message ?? `Cobrança já emitida no provedor (código de solicitação ${requestCode}).`, 409);
    this.name = 'BankPaymentAlreadyExistsError';
    this.requestCode = requestCode;
  }
}
