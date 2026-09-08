import { QueueDepthDto } from '../usecases/get-nfse-metrics/dtos/get-nfse-metrics.dto';

export interface INfseQueueMonitor {
  /**
   * Profundidade de cada fila do fluxo. É o que responde "a emissão está atrasada?" sem abrir o Bull
   * Board — e o que dá base ao alerta de fila parada e de DLQ não vazia.
   */
  getDepth(): Promise<QueueDepthDto[]>;
}
