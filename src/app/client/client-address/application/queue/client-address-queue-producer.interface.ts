import type { ResolveClientAddressIbgeCodeJobDto } from './jobs/resolve-client-address-ibge-code-job.dto';

export interface IClientAddressQueueProducer {
  addResolveIbgeCodeJob(data: ResolveClientAddressIbgeCodeJobDto): Promise<void>;
}
