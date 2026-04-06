import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { TOKENS } from 'src/core/di/token';
import { AppException } from 'src/core/filters/app.exception';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { QueueName } from 'src/infra/queue/enums/queue-name.enum';
import type { IUploadFileGateway } from 'src/infra/upload-file/upload-file.gateway';
import { Readable } from 'stream';
import type { DeleteFileJobDto } from '../../../application/queue/jobs/delete-file-job.dto';
import type { UploadFileJobDto } from '../../../application/queue/jobs/upload-file-job.dto';

function createMulterFileFromUploadJobDto(dto: UploadFileJobDto): Express.Multer.File {
  const buffer = Buffer.from(dto.bufferBase64, 'base64');
  return {
    fieldname: 'file',
    originalname: dto.originalName,
    encoding: '7bit',
    mimetype: dto.mimetype,
    size: dto.size,
    buffer,
    destination: '',
    filename: '',
    path: '',
    stream: Readable.from(buffer),
  };
}

@Processor(QueueName.UploadFile)
@Injectable()
export class UploadFileBullmqConsumer extends WorkerHost {
  constructor(
    @Inject(TOKENS.UploadFileGateway) private readonly uploadFileGateway: IUploadFileGateway,
  ) {
    super();
  }

  public async process(job: Job<UploadFileJobDto | DeleteFileJobDto>): Promise<void> {
    switch (job.name) {
      case JobName.UploadFile:
        await this.uploadFileGateway.upload(createMulterFileFromUploadJobDto(job.data as UploadFileJobDto));
        return;
      case JobName.DeleteFile:
        await this.uploadFileGateway.delete((job.data as DeleteFileJobDto).fileKey);
        return;
      default:
        throw new AppException(`Unknown job name: ${job.name}`);
    }
  }
}
