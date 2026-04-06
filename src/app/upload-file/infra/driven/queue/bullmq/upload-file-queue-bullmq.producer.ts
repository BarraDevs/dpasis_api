import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import type { DeleteFileJobDto } from '../../../../application/queue/jobs/delete-file-job.dto';
import type { UploadFileJobDto } from '../../../../application/queue/jobs/upload-file-job.dto';
import type { IUploadFileQueueProducer } from '../../../../application/queue/upload-file-queue-producer.interface';

@Injectable()
export class UploadFileQueueBullmqAdapterProducer implements IUploadFileQueueProducer {
  constructor(
    @InjectQueue(QueueName.UploadFile) private readonly queue: Queue,
  ) {}

  public async addUploadJob(data: UploadFileJobDto): Promise<void> {
    await this.queue.add(JobName.UploadFile, data);
  }

  public async addDeleteJob(data: DeleteFileJobDto): Promise<void> {
    await this.queue.add(JobName.DeleteFile, data);
  }
}
