import { Injectable } from '@nestjs/common';
import type { INfseQueueMonitor } from '../../../../application/queue/nfse-queue-monitor.interface';
import { QueueDepthDto } from '../../../../application/usecases/get-nfse-metrics/dtos/get-nfse-metrics.dto';

/** Sem BullMQ em teste não há fila para medir; o campo existe e vem vazio. */
@Injectable()
export class NfseQueueFakeAdapterMonitor implements INfseQueueMonitor {
  public depth: QueueDepthDto[] = [];

  public async getDepth(): Promise<QueueDepthDto[]> {
    return this.depth;
  }
}
