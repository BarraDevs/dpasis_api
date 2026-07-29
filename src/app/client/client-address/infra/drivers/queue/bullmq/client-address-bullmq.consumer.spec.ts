import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Job } from 'bullmq';
import { AppException } from 'src/core/filters/app.exception';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import type { ResolveClientAddressIbgeCodeJobDto } from '../../../../application/queue/jobs/resolve-client-address-ibge-code-job.dto';
import { ProcessResolveClientAddressIbgeCode } from '../../../../application/usecases/process-resolve-client-address-ibge-code/process-resolve-client-address-ibge-code.service';
import { ClientAddressBullmqConsumer } from './client-address-bullmq.consumer';

function makeJob<T>(name: string, data: T): Job<T> {
  return { name, data } as Job<T>;
}

function makeResolveIbgeCodeJob(overrides: Partial<ResolveClientAddressIbgeCodeJobDto> = {}): ResolveClientAddressIbgeCodeJobDto {
  return { clientAddressId: 1, zipCode: '12345-678', ...overrides };
}

describe('ClientAddressBullmqConsumer', () => {
  let sut: ClientAddressBullmqConsumer;
  let processResolveClientAddressIbgeCode: ProcessResolveClientAddressIbgeCode;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ClientAddressBullmqConsumer,
        { provide: ProcessResolveClientAddressIbgeCode, useValue: createMock<ProcessResolveClientAddressIbgeCode>() },
      ],
    }).compile();

    sut = module.get(ClientAddressBullmqConsumer);
    processResolveClientAddressIbgeCode = module.get(ProcessResolveClientAddressIbgeCode);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('process', () => {
    it('should delegate resolve-client-address-ibge-code jobs to ProcessResolveClientAddressIbgeCode', async() => {
      const payload = makeResolveIbgeCodeJob({ clientAddressId: 42 });
      const executeSpy = jest.spyOn(processResolveClientAddressIbgeCode, 'execute').mockResolvedValue();

      await sut.process(makeJob(JobName.ResolveClientAddressIbgeCode, payload));

      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(executeSpy).toHaveBeenCalledWith(payload);
    });

    it('should throw AppException for unknown job name', async() => {
      const job = { name: 'unknown-job', data: {} } as Job<ResolveClientAddressIbgeCodeJobDto>;

      const error = await sut.process(job).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(AppException);
      expect((error as Error).message).toBe('Unknown job name: unknown-job');
      expect(processResolveClientAddressIbgeCode.execute).not.toHaveBeenCalled();
    });

    it('should propagate ProcessResolveClientAddressIbgeCode errors', async() => {
      const payload = makeResolveIbgeCodeJob();
      const err = new Error('resolve failed');
      jest.spyOn(processResolveClientAddressIbgeCode, 'execute').mockRejectedValue(err);

      await expect(sut.process(makeJob(JobName.ResolveClientAddressIbgeCode, payload))).rejects.toBe(err);
    });
  });
});
