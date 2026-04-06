import type { DeleteFileJobDto } from './jobs/delete-file-job.dto';
import type { UploadFileJobDto } from './jobs/upload-file-job.dto';

export interface IUploadFileQueueProducer {
  addUploadJob(data: UploadFileJobDto): Promise<void>;
  addDeleteJob(data: DeleteFileJobDto): Promise<void>;
}
