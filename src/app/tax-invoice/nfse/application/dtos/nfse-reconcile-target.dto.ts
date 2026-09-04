import { NfseStatus } from '../../domain/enums/nfse-status.enum';

/**
 * Projeção mínima para as varreduras de reconciliação: o suficiente para montar a chave natural do
 * RPS e para decidir, sem carregar o snapshot em `data` de centenas de notas.
 */
export class NfseReconcileTargetDto {
  id: number;
  companyId: number;
  rpsNumber: number;
  rpsSeries: string;
  status: NfseStatus;
}
