import { AppException } from 'src/core/filters/app.exception';

export class BankPaymentRequestError extends AppException {
  /**
   * O campo `detail` do corpo de erro do provedor, preservado como veio. O cliente HTTP achata a
   * resposta numa mensagem; quem chama às vezes precisa do campo original para decidir — a recusa
   * por duplicidade do Inter, por exemplo, traz o `codigoSolicitacao` da cobrança já emitida aí
   * dentro. Continua sendo prosa, não contrato: quem ler tem que confirmar por consulta.
   */
  public readonly detail?: string;

  constructor(message = 'Requisição inválida na API de cobrança bancária.', detail?: string) {
    super(message, 400);
    this.name = 'BankPaymentRequestError';
    this.detail = detail;
  }
}
