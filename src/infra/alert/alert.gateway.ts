import { AlertDto } from './dtos/alert.dto';

export interface IAlertGateway {
  /**
   * Nunca lança — quem chama é uma varredura periódica e um canal fora do ar não pode derrubá-la.
   * Devolve `false` quando a entrega falhou, para que o chamador possa tentar de novo na janela
   * seguinte em vez de tratar silêncio como sucesso.
   */
  send(alert: AlertDto): Promise<boolean>;

  /**
   * Diz se o canal está de pé **sem** mandar alerta nenhum.
   *
   * Até aqui a única forma de saber se o e-mail sairia era esperar um incidente. Como todo o valor
   * das varreduras depende deste canal — nota presa, cobrança com falha, certificado a vencer —,
   * "o SMTP está configurado" precisava virar uma pergunta que se responde antes, não depois.
   * Também nunca lança: devolve `false` e o motivo fica no log.
   */
  verify(): Promise<boolean>;
}
