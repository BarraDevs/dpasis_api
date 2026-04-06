import { DeleteObjectCommand, S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from 'src/core/config/config.service';
import type { ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { LogContext } from 'src/infra/logger/logger.gateway';
import { UploadS3AdapterGateway } from './upload-s3.gateway';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/lib-storage');

jest.mock('crypto', () => ({
  ...jest.requireActual<typeof import('crypto')>('crypto'),
  randomUUID: jest.fn(() => '00000000-0000-0000-0000-000000000001'),
}));

describe('UploadS3AdapterGateway', () => {
  let sut: UploadS3AdapterGateway;
  let logger: jest.Mocked<Pick<ILoggerGateway, 'error'>>;
  let configService: jest.Mocked<Pick<ConfigService, 'awsAccessKeyId' | 'awsSecretAccessKey' | 'awsBucketName'>>;

  let mockS3Send: jest.Mock;
  let mockUploadDone: jest.Mock;

  beforeEach(() => {
    mockS3Send = jest.fn().mockResolvedValue(undefined);
    mockUploadDone = jest.fn().mockResolvedValue({
      Location: 'https://my-bucket.s3.amazonaws.com/client-attachments/00000000-0000-0000-0000-000000000001-photo.jpg',
    });

    jest.mocked(S3).mockImplementation(() => ({ send: mockS3Send }) as unknown as S3);
    jest.mocked(Upload).mockImplementation(() => ({ done: mockUploadDone }) as unknown as Upload);
    jest.mocked(DeleteObjectCommand).mockImplementation((input) => input as unknown as DeleteObjectCommand);

    logger = { error: jest.fn() };
    configService = {
      awsAccessKeyId: 'AKIA_TEST_KEY',
      awsSecretAccessKey: 'test-secret',
      awsBucketName: 'my-bucket',
    };

    sut = new UploadS3AdapterGateway(logger as unknown as ILoggerGateway, configService as unknown as ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should return Location from S3 upload response', async() => {
      const file = createMock<Express.Multer.File>({
        buffer: Buffer.from('data'),
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 4,
      });

      const url = await sut.upload(file, 'client-attachments');

      expect(url).toBe(
        'https://my-bucket.s3.amazonaws.com/client-attachments/00000000-0000-0000-0000-000000000001-photo.jpg',
      );
      expect(mockUploadDone).toHaveBeenCalledTimes(1);
      expect(Upload).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            Bucket: 'my-bucket',
            ContentType: 'image/jpeg',
            Key: 'client-attachments/00000000-0000-0000-0000-000000000001-photo.jpg',
          }),
        }),
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should omit folder prefix when folder is undefined', async() => {
      const file = createMock<Express.Multer.File>({
        buffer: Buffer.from('x'),
        originalname: 'a.png',
        mimetype: 'image/png',
        size: 1,
      });

      await sut.upload(file);

      expect(Upload).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            Key: '00000000-0000-0000-0000-000000000001-a.png',
          }),
        }),
      );
    });

    it('should log and throw ExternalApiError when upload fails', async() => {
      const failure = new Error('S3 network error');
      mockUploadDone.mockRejectedValueOnce(failure);

      const file = createMock<Express.Multer.File>({
        buffer: Buffer.from('data'),
        originalname: 'f.jpg',
        mimetype: 'image/jpeg',
        size: 4,
      });

      await expect(sut.upload(file)).rejects.toThrow('Erro ao fazer upload do arquivo');

      expect(logger.error).toHaveBeenCalledWith(LogContext.UPLOAD_FILE, {
        adapter: 's3',
        action: 'upload',
        fileName: 'f.jpg',
        fileSize: 4,
        fileType: 'image/jpeg',
        error: failure,
      });
    });
  });

  describe('delete', () => {
    it('should call S3 delete with key extracted from public URL', async() => {
      const publicUrl = 'https://my-bucket.s3.amazonaws.com/client-attachments/uuid-old.pdf';

      await sut.delete(publicUrl);

      expect(mockS3Send).toHaveBeenCalledTimes(1);
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'my-bucket',
        Key: 'client-attachments/uuid-old.pdf',
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should not call S3 when URL has empty path', async() => {
      await sut.delete('https://my-bucket.s3.amazonaws.com/');

      expect(mockS3Send).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should not call S3 when URL is invalid', async() => {
      await sut.delete('not-a-valid-url');

      expect(mockS3Send).not.toHaveBeenCalled();
    });

    it('should log and throw ExternalApiError when delete fails', async() => {
      const failure = new Error('AccessDenied');
      mockS3Send.mockRejectedValueOnce(failure);

      const publicUrl = 'https://my-bucket.s3.amazonaws.com/path/file.pdf';

      await expect(sut.delete(publicUrl)).rejects.toThrow('Erro ao excluir o arquivo');

      expect(logger.error).toHaveBeenCalledWith(LogContext.UPLOAD_FILE, {
        adapter: 's3',
        action: 'delete',
        publicUrl,
        fileKey: 'path/file.pdf',
        error: failure,
      });
    });
  });
});
