import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FileTooBigError } from 'src/app/upload-file/domain/errors/file-too-big.error';
import { InvalidFileError } from 'src/app/upload-file/domain/errors/invalid-file.error';
import { RequiredFileError } from 'src/app/upload-file/domain/errors/required-file.error';
import { UploadFileModule } from 'src/app/upload-file/upload-file.module';
import { ConfigModule } from 'src/core/config/config.module';
import { UploadSingle } from './upload-single.service';

describe('UploadSingle', () => {
  let sut: UploadSingle;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        UploadFileModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get<UploadSingle>(UploadSingle);
  });

  describe('file existence validation', () => {
    it('should throw RequiredFileError when file is null', async() => {
      expect.assertions(1);
      return sut.execute(null as any).catch((error) => {
        expect(error).toBeInstanceOf(RequiredFileError);
      });
    });

    it('should throw RequiredFileError when file is undefined', async() => {
      expect.assertions(1);
      return sut.execute(undefined as any).catch((error) => {
        expect(error).toBeInstanceOf(RequiredFileError);
      });
    });

    it('should proceed when file is provided', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/jpeg',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      const result = await sut.execute(file);

      expect(result).toEqual({ url: 'url' });
      expect(uploadSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('file size validation', () => {
    it('should accept file with exactly 20MB', async() => {
      const TWENTY_MB = 20 * 1024 * 1024;
      const file = createMock<Express.Multer.File>({
        size: TWENTY_MB,
        mimetype: 'image/jpeg',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      const result = await sut.execute(file);

      expect(result).toEqual({ url: 'url' });
      expect(uploadSpy).toHaveBeenCalledTimes(1);
    });

    it('should accept file with 1 byte less than 20MB', async() => {
      const TWENTY_MB = 20 * 1024 * 1024;
      const file = createMock<Express.Multer.File>({
        size: TWENTY_MB - 1,
        mimetype: 'image/png',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      const result = await sut.execute(file);

      expect(result).toEqual({ url: 'url' });
      expect(uploadSpy).toHaveBeenCalledTimes(1);
    });

    it('should reject file with 1 byte more than 20MB', async() => {
      const TWENTY_MB = 20 * 1024 * 1024;
      const file = createMock<Express.Multer.File>({
        size: TWENTY_MB + 1,
        mimetype: 'image/jpeg',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload');

      expect.assertions(2);
      return sut.execute(file).catch((error) => {
        expect(error).toBeInstanceOf(FileTooBigError);
        expect(uploadSpy).not.toHaveBeenCalled();
      });
    });

    it('should accept file with size 0', async() => {
      const file = createMock<Express.Multer.File>({
        size: 0,
        mimetype: 'image/webp',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      const result = await sut.execute(file);

      expect(result).toEqual({ url: 'url' });
      expect(uploadSpy).toHaveBeenCalledTimes(1);
    });

    it('should accept very small file (1KB)', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/jpeg',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      const result = await sut.execute(file);

      expect(result).toEqual({ url: 'url' });
      expect(uploadSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('mime type validation', () => {
    it('should accept image/jpeg mime type', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/jpeg',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      const result = await sut.execute(file);

      expect(result).toEqual({ url: 'url' });
      expect(uploadSpy).toHaveBeenCalledTimes(1);
    });

    it('should accept image/png mime type', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/png',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      const result = await sut.execute(file);

      expect(result).toEqual({ url: 'url' });
      expect(uploadSpy).toHaveBeenCalledTimes(1);
    });

    it('should accept image/webp mime type', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/webp',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      const result = await sut.execute(file);

      expect(result).toEqual({ url: 'url' });
      expect(uploadSpy).toHaveBeenCalledTimes(1);
    });

    it('should accept image/jpg mime type', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/jpg',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      const result = await sut.execute(file);

      expect(result).toEqual({ url: 'url' });
      expect(uploadSpy).toHaveBeenCalledTimes(1);
    });

    it('should accept application/octet-stream mime type (iOS files)', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'application/octet-stream',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      const result = await sut.execute(file);

      expect(result).toEqual({ url: 'url' });
      expect(uploadSpy).toHaveBeenCalledTimes(1);
    });

    it('should reject image/gif mime type', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/gif',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload');

      expect.assertions(2);
      return sut.execute(file).catch((error) => {
        expect(error).toBeInstanceOf(InvalidFileError);
        expect(uploadSpy).not.toHaveBeenCalled();
      });
    });

    it('should reject image/svg+xml mime type', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/svg+xml',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload');

      expect.assertions(2);
      return sut.execute(file).catch((error) => {
        expect(error).toBeInstanceOf(InvalidFileError);
        expect(uploadSpy).not.toHaveBeenCalled();
      });
    });

    it('should reject application/pdf mime type', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'application/pdf',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload');

      expect.assertions(2);
      return sut.execute(file).catch((error) => {
        expect(error).toBeInstanceOf(InvalidFileError);
        expect(uploadSpy).not.toHaveBeenCalled();
      });
    });

    it('should reject text/plain mime type', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'text/plain',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload');

      expect.assertions(2);
      return sut.execute(file).catch((error) => {
        expect(error).toBeInstanceOf(InvalidFileError);
        expect(uploadSpy).not.toHaveBeenCalled();
      });
    });

    it('should reject video/mp4 mime type', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'video/mp4',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload');

      expect.assertions(2);
      return sut.execute(file).catch((error) => {
        expect(error).toBeInstanceOf(InvalidFileError);
        expect(uploadSpy).not.toHaveBeenCalled();
      });
    });

    it('should reject empty mime type', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: '',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload');

      expect.assertions(2);
      return sut.execute(file).catch((error) => {
        expect(error).toBeInstanceOf(InvalidFileError);
        expect(uploadSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('folder parameter', () => {
    it('should upload without folder when not provided', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/png',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      await sut.execute(file);

      expect(uploadSpy).toHaveBeenCalledWith(expect.anything(), undefined);
    });

    it('should upload to avatars folder', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/jpeg',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      await sut.execute(file, 'avatars');

      expect(uploadSpy).toHaveBeenCalledWith(expect.anything(), 'avatars');
    });

    it('should upload to documents folder', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/png',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      await sut.execute(file, 'documents');

      expect(uploadSpy).toHaveBeenCalledWith(expect.anything(), 'documents');
    });

    it('should handle empty string as folder', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/webp',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      await sut.execute(file, '');

      expect(uploadSpy).toHaveBeenCalledWith(expect.anything(), '');
    });

    it('should handle nested folder paths', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/jpeg',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      await sut.execute(file, 'users/avatars/2024');

      expect(uploadSpy).toHaveBeenCalledWith(expect.anything(), 'users/avatars/2024');
    });
  });

  describe('gateway integration', () => {
    it('should return url with special characters', async() => {
      const url = 'https://cdn.example.com/files/image-name%20with%20spaces.png?token=abc123';
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/png',
      });
      jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue(url);

      const result = await sut.execute(file);

      expect(result).toEqual({ url });
    });

    it('should propagate gateway errors', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/jpeg',
      });
      const gatewayError = new Error('S3 upload failed');
      jest.spyOn(sut['uploadGateway'], 'upload').mockRejectedValue(gatewayError);

      expect.assertions(1);
      return sut.execute(file).catch((error) => {
        expect(error).toBe(gatewayError);
      });
    });

    it('should handle gateway returning empty string', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/png',
      });
      jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('');

      const result = await sut.execute(file);

      expect(result).toEqual({ url: '' });
    });

    it('should call gateway with the provided file object', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
        buffer: Buffer.from('fake-image-data'),
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      await sut.execute(file);

      expect(uploadSpy).toHaveBeenCalledWith(file, undefined);
    });
  });

  describe('edge cases', () => {
    it('should handle file object with all properties', async() => {
      const file = createMock<Express.Multer.File>({
        fieldname: 'file',
        originalname: 'photo.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 5000,
        buffer: Buffer.from('data'),
        destination: '/tmp',
        filename: 'photo-123.png',
        path: '/tmp/photo-123.png',
        stream: null as any,
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload').mockResolvedValue('url');

      const result = await sut.execute(file);

      expect(result).toEqual({ url: 'url' });
      expect(uploadSpy).toHaveBeenCalledWith(file, undefined);
    });

    it('should validate file before calling gateway (order of operations)', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'application/zip',
      });
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload');

      expect.assertions(2);
      return sut.execute(file).catch((error) => {
        expect(error).toBeInstanceOf(InvalidFileError);
        expect(uploadSpy).not.toHaveBeenCalled();
      });
    });

    it('should check file existence before size validation', async() => {
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload');

      expect.assertions(2);
      return sut.execute(null as any).catch((error) => {
        expect(error).toBeInstanceOf(RequiredFileError);
        expect(uploadSpy).not.toHaveBeenCalled();
      });
    });

    it('should check file existence before mime type validation', async() => {
      const uploadSpy = jest.spyOn(sut['uploadGateway'], 'upload');

      expect.assertions(2);
      return sut.execute(undefined as any).catch((error) => {
        expect(error).toBeInstanceOf(RequiredFileError);
        expect(uploadSpy).not.toHaveBeenCalled();
      });
    });
  });
});
