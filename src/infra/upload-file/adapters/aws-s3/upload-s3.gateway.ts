import { DeleteObjectCommand, S3 } from '@aws-sdk/client-s3';
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
  private s3: S3;

  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly configService: ConfigService,
  ) {}

  private getFileKey(publicUrl: string): string | null {
    try {
      const u = new URL(publicUrl);
      const path = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
      const key = decodeURIComponent(path);
      return key.length > 0 ? key : null;
    }
    catch {
      return null;
    }
  }

  private async getS3Client(): Promise<S3> {
    if (this.s3) {
      return this.s3;
    }

    this.s3 = new S3({
      credentials: {
        accessKeyId: this.configService.awsAccessKeyId,
        secretAccessKey: this.configService.awsSecretAccessKey,
      },
    });

    return this.s3;
  }

  public async upload(file: Express.Multer.File, folder?: string): Promise<string> {
    try {
      const s3 = await this.getS3Client();

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

  public async delete(publicUrl: string): Promise<void> {
    const fileKey = this.getFileKey(publicUrl);
    if (!fileKey) {
      return;
    }

    try {
      const s3 = await this.getS3Client();

      await s3.send(
        new DeleteObjectCommand({
          Bucket: this.configService.awsBucketName,
          Key: fileKey,
        }),
      );
    }
    catch (error) {
      this.logger.error(LogContext.UPLOAD_FILE, {
        adapter: 's3',
        action: 'delete',
        publicUrl,
        fileKey,
        error,
      });
      throw new ExternalApiError('Erro ao excluir o arquivo');
    }
  }
}
