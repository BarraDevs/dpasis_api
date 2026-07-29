import { JobName } from 'src/infra/queue/enums/job-name.enum';
import type { ResolveClientAddressIbgeCodeJobDto } from '../../../../application/queue/jobs/resolve-client-address-ibge-code-job.dto';
import { ClientAddressQueueFakeAdapterProducer } from './client-address-queue-fake.producer';

function makeResolveIbgeCodeJob(overrides: Partial<ResolveClientAddressIbgeCodeJobDto> = {}): ResolveClientAddressIbgeCodeJobDto {
  return { clientAddressId: 1, zipCode: '12345-678', ...overrides };
}

describe('ClientAddressQueueFakeAdapterProducer - Unit tests', () => {
  let sut: ClientAddressQueueFakeAdapterProducer;

  beforeEach(() => {
    sut = new ClientAddressQueueFakeAdapterProducer();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should start with empty job array', () => {
    expect(sut.addedResolveIbgeCodeJobs).toEqual([]);
  });

  describe('addResolveIbgeCodeJob', () => {
    it('should append the job with the correct name and payload', async() => {
      const data = makeResolveIbgeCodeJob({ clientAddressId: 42 });

      await sut.addResolveIbgeCodeJob(data);

      expect(sut.addedResolveIbgeCodeJobs).toEqual([
        { name: JobName.ResolveClientAddressIbgeCode, data },
      ]);
    });

    it('should accumulate multiple jobs', async() => {
      const first = makeResolveIbgeCodeJob({ clientAddressId: 1 });
      const second = makeResolveIbgeCodeJob({ clientAddressId: 2 });

      await sut.addResolveIbgeCodeJob(first);
      await sut.addResolveIbgeCodeJob(second);

      expect(sut.addedResolveIbgeCodeJobs).toHaveLength(2);
      expect(sut.addedResolveIbgeCodeJobs[1]).toEqual({ name: JobName.ResolveClientAddressIbgeCode, data: second });
    });
  });
});
