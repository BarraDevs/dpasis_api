import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Inject, Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { type ILoggerGateway, LogContext } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { IUploadFileGateway } from '../../upload-file.gateway';

@Injectable()
export class UploadS3AdapterGateway implements IUploadFileGateway {
  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly configService: ConfigService,
  ) {}

  public async upload(file: Express.Multer.File, folder?: string): Promise<string> {
    try {
      const s3 = new S3({
        credentials: {
          accessKeyId: this.configService.awsAccessKeyId,
          secretAccessKey: this.configService.awsSecretAccessKey,
        },
        region: this.configService.awsRegion,
      });

      const s3Response = await new Upload({
        client: s3,
        params: {
          ACL: 'public-read',
          Body: file.buffer,
          Bucket: this.configService.awsBucketName,
          ContentType: file.mimetype,
          Key: `${folder ? folder + '/' : ''}${crypto.randomUUID()}-${file.originalname}`,
        },
      }).done();

      return s3Response.Location!;
    }
    catch (error) {
      this.logger.error(LogContext.UPLOAD_FILE, {
        adapter: 's3',
        action: 'upload',
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        error,
      });
      throw new ExternalApiError('Erro ao fazer upload do arquivo');
    }
  }
}
