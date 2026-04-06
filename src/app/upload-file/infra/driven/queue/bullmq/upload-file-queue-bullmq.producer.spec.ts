import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import type { DeleteFileJobDto } from '../../../../application/queue/jobs/delete-file-job.dto';
import type { UploadFileJobDto } from '../../../../application/queue/jobs/upload-file-job.dto';
import { UploadFileQueueBullmqAdapterProducer } from './upload-file-queue-bullmq.producer';

describe('UploadFileQueueBullmqAdapterProducer', () => {
  let sut: UploadFileQueueBullmqAdapterProducer;
  const queueAdd = jest.fn().mockResolvedValue(undefined);

  beforeEach(async() => {
    queueAdd.mockClear().mockResolvedValue(undefined);

    const module = await Test.createTestingModule({
      providers: [
        UploadFileQueueBullmqAdapterProducer,
        {
          provide: getQueueToken(QueueName.UploadFile),
          useValue: { add: queueAdd },
        },
      ],
    }).compile();

    sut = module.get(UploadFileQueueBullmqAdapterProducer);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('addUploadJob', () => {
    it('should enqueue upload job with payload', async() => {
      const data: UploadFileJobDto = {
        originalName: 'a.png',
        mimetype: 'image/png',
        size: 4,
        bufferBase64: Buffer.from('data').toString('base64'),
        folder: 'docs',
      };

      await sut.addUploadJob(data);

      expect(queueAdd).toHaveBeenCalledTimes(1);
      expect(queueAdd).toHaveBeenCalledWith(JobName.UploadFile, data);
    });

    it('should propagate queue.add errors', async() => {
      const data: UploadFileJobDto = {
        originalName: 'a.png',
        mimetype: 'image/png',
        size: 1,
        bufferBase64: 'YQ==',
      };
      const err = new Error('Redis down');
      queueAdd.mockRejectedValueOnce(err);

      await expect(sut.addUploadJob(data)).rejects.toBe(err);
    });
  });

  describe('addDeleteJob', () => {
    it('should enqueue delete job with payload', async() => {
      const data: DeleteFileJobDto = { fileUrl: 'https://cdn.example/file.png' };

      await sut.addDeleteJob(data);

      expect(queueAdd).toHaveBeenCalledTimes(1);
      expect(queueAdd).toHaveBeenCalledWith(JobName.DeleteFile, data);
    });

    it('should propagate queue.add errors', async() => {
      const data: DeleteFileJobDto = { fileUrl: 'https://x' };
      const err = new Error('Redis down');
      queueAdd.mockRejectedValueOnce(err);

      await expect(sut.addDeleteJob(data)).rejects.toBe(err);
    });
  });
});
