import { AlertDto } from './dtos/alert.dto';

export interface IAlertGateway {
  /**
   * Nunca lança — quem chama é uma varredura periódica e um canal fora do ar não pode derrubá-la.
   * Devolve `false` quando a entrega falhou, para que o chamador possa tentar de novo na janela
   * seguinte em vez de tratar silêncio como sucesso.
   */
  send(alert: AlertDto): Promise<boolean>;
}
