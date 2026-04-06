import { Injectable } from '@nestjs/common';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import type { DeleteFileJobDto } from '../../../../application/queue/jobs/delete-file-job.dto';
import type { UploadFileJobDto } from '../../../../application/queue/jobs/upload-file-job.dto';
import type { IUploadFileQueueProducer } from '../../../../application/queue/upload-file-queue-producer.interface';

@Injectable()
export class UploadFileQueueFakeAdapterProducer implements IUploadFileQueueProducer {
  public readonly addedUploadJobs: Array<{ name: JobName; data: UploadFileJobDto }> = [];
  public readonly addedDeleteJobs: Array<{ name: JobName; data: DeleteFileJobDto }> = [];

  public async addUploadJob(data: UploadFileJobDto): Promise<void> {
    this.addedUploadJobs.push({ name: JobName.UploadFile, data });
  }

  public async addDeleteJob(data: DeleteFileJobDto): Promise<void> {
    this.addedDeleteJobs.push({ name: JobName.DeleteFile, data });
  }
}
