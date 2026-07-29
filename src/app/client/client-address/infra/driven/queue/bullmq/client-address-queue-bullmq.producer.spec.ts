import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import type { ResolveClientAddressIbgeCodeJobDto } from '../../../../application/queue/jobs/resolve-client-address-ibge-code-job.dto';
import { ClientAddressQueueBullmqAdapterProducer } from './client-address-queue-bullmq.producer';

function makeResolveIbgeCodeJob(overrides: Partial<ResolveClientAddressIbgeCodeJobDto> = {}): ResolveClientAddressIbgeCodeJobDto {
  return { clientAddressId: 1, zipCode: '12345-678', ...overrides };
}

describe('ClientAddressQueueBullmqAdapterProducer', () => {
  let sut: ClientAddressQueueBullmqAdapterProducer;
  const queueAdd = jest.fn().mockResolvedValue(undefined);

  beforeEach(async() => {
    queueAdd.mockClear().mockResolvedValue(undefined);

    const module = await Test.createTestingModule({
      providers: [
        ClientAddressQueueBullmqAdapterProducer,
        {
          provide: getQueueToken(QueueName.ClientAddress),
          useValue: { add: queueAdd },
        },
      ],
    }).compile();

    sut = module.get(ClientAddressQueueBullmqAdapterProducer);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('addResolveIbgeCodeJob', () => {
    it('should enqueue job with payload', async() => {
      const data = makeResolveIbgeCodeJob({ clientAddressId: 42 });

      await sut.addResolveIbgeCodeJob(data);

      expect(queueAdd).toHaveBeenCalledTimes(1);
      expect(queueAdd).toHaveBeenCalledWith(JobName.ResolveClientAddressIbgeCode, data);
    });

    it('should propagate queue.add errors', async() => {
      const data = makeResolveIbgeCodeJob();
      const err = new Error('Redis down');
      queueAdd.mockRejectedValueOnce(err);

      await expect(sut.addResolveIbgeCodeJob(data)).rejects.toBe(err);
    });
  });
});
