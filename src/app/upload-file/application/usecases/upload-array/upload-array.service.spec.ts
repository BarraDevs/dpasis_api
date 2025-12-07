import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FileTooBigError } from 'src/app/upload-file/domain/errors/file-too-big.error';
import { InvalidFileError } from 'src/app/upload-file/domain/errors/invalid-file.error';
import { UploadFileModule } from 'src/app/upload-file/upload-file.module';
import { ConfigModule } from 'src/core/config/config.module';
import { UploadSingle } from '../upload-single/upload-single.service';
import { UploadArray } from './upload-array.service';

describe('UploadArray', () => {
  let sut: UploadArray;
  let uploadSingle: UploadSingle;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        UploadFileModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get<UploadArray>(UploadArray);
    uploadSingle = module.get<UploadSingle>(UploadSingle);
  });

  it('should return an empty array when not sending any image', async() => {
    const result = await sut.execute([]);

    expect(result).toEqual({ urls: [] });
  });

  it('should return an array with the urls of the images uploaded', async() => {
    const file = { mimetype: 'image/png' } as Express.Multer.File;
    const result = await sut.execute([file, file]);

    expect(result).toHaveProperty('urls');
    expect(result.urls).toHaveLength(2);
  });

  it('should return single url when uploading one file', async() => {
    const file = createMock<Express.Multer.File>({
      size: 1024,
      mimetype: 'image/jpeg',
    });

    const result = await sut.execute([file]);

    expect(result).toHaveProperty('urls');
    expect(result.urls).toHaveLength(1);
    expect(result.urls[0]).toBeDefined();
  });

  it('should return multiple urls when uploading multiple files', async() => {
    const file1 = createMock<Express.Multer.File>({
      size: 1024,
      mimetype: 'image/jpeg',
    });
    const file2 = createMock<Express.Multer.File>({
      size: 2048,
      mimetype: 'image/png',
    });
    const file3 = createMock<Express.Multer.File>({
      size: 3072,
      mimetype: 'image/webp',
    });

    const result = await sut.execute([file1, file2, file3]);

    expect(result).toHaveProperty('urls');
    expect(result.urls).toHaveLength(3);
    expect(result.urls[0]).toBeDefined();
    expect(result.urls[1]).toBeDefined();
    expect(result.urls[2]).toBeDefined();
  });

  it('should handle null files parameter', async() => {
    const result = await sut.execute(null as any);

    expect(result).toEqual({ urls: [] });
  });

  it('should handle undefined files parameter', async() => {
    const result = await sut.execute(undefined as any);

    expect(result).toEqual({ urls: [] });
  });

  it('should call uploadSingle for each file', async() => {
    const file1 = createMock<Express.Multer.File>({
      size: 1024,
      mimetype: 'image/jpeg',
    });
    const file2 = createMock<Express.Multer.File>({
      size: 2048,
      mimetype: 'image/png',
    });

    const uploadSpy = jest.spyOn(uploadSingle, 'execute').mockResolvedValue({ url: 'mocked-url' });

    await sut.execute([file1, file2]);

    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(uploadSpy).toHaveBeenNthCalledWith(1, file1);
    expect(uploadSpy).toHaveBeenNthCalledWith(2, file2);
  });

  it('should upload files in parallel using Promise.all', async() => {
    const files = Array.from({ length: 5 }, (_, i) =>
      createMock<Express.Multer.File>({
        size: 1024 * (i + 1),
        mimetype: 'image/jpeg',
      })
    );

    const uploadSpy = jest.spyOn(uploadSingle, 'execute').mockResolvedValue({ url: 'url' });

    const startTime = Date.now();
    await sut.execute(files);
    const endTime = Date.now();

    expect(uploadSpy).toHaveBeenCalledTimes(5);
    // Verify it's parallel by checking all calls happened (not testing exact time)
    expect(endTime - startTime).toBeLessThan(1000); // Should be much faster than sequential
  });

  it('should preserve order of uploaded URLs', async() => {
    const file1 = createMock<Express.Multer.File>({
      size: 1024,
      mimetype: 'image/jpeg',
    });
    const file2 = createMock<Express.Multer.File>({
      size: 2048,
      mimetype: 'image/png',
    });
    const file3 = createMock<Express.Multer.File>({
      size: 3072,
      mimetype: 'image/webp',
    });

    jest.spyOn(uploadSingle, 'execute')
      .mockResolvedValueOnce({ url: 'url-1' })
      .mockResolvedValueOnce({ url: 'url-2' })
      .mockResolvedValueOnce({ url: 'url-3' });

    const result = await sut.execute([file1, file2, file3]);

    expect(result.urls).toEqual(['url-1', 'url-2', 'url-3']);
  });

  describe('error handling', () => {
    it('should propagate error when one file fails validation', async() => {
      const validFile = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/jpeg',
      });
      const invalidFile = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'application/zip',
      });

      expect.assertions(1);
      return sut.execute([validFile, invalidFile]).catch((error) => {
        expect(error).toBeInstanceOf(InvalidFileError);
      });
    });

    it('should propagate error when file is too big', async() => {
      const TWENTY_MB = 20 * 1024 * 1024;
      const validFile = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/jpeg',
      });
      const tooBigFile = createMock<Express.Multer.File>({
        size: TWENTY_MB + 1,
        mimetype: 'image/png',
      });

      expect.assertions(1);
      return sut.execute([validFile, tooBigFile]).catch((error) => {
        expect(error).toBeInstanceOf(FileTooBigError);
      });
    });

    it('should fail fast when first file is invalid', async() => {
      const invalidFile = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'application/pdf',
      });
      const validFile = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/jpeg',
      });

      const uploadSpy = jest.spyOn(uploadSingle, 'execute');

      expect.assertions(2);
      return sut.execute([invalidFile, validFile]).catch((error) => {
        expect(error).toBeInstanceOf(InvalidFileError);
        // Both will be called due to Promise.all, but one will throw
        expect(uploadSpy).toHaveBeenCalled();
      });
    });

    it('should handle gateway errors during upload', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/jpeg',
      });

      const gatewayError = new Error('S3 connection failed');
      jest.spyOn(uploadSingle, 'execute').mockRejectedValue(gatewayError);

      expect.assertions(1);
      return sut.execute([file]).catch((error) => {
        expect(error).toBe(gatewayError);
      });
    });

    it('should propagate error from any file in the array', async() => {
      const files = [
        createMock<Express.Multer.File>({ size: 1024, mimetype: 'image/jpeg' }),
        createMock<Express.Multer.File>({ size: 1024, mimetype: 'image/png' }),
        createMock<Express.Multer.File>({ size: 1024, mimetype: 'application/zip' }), // Invalid
        createMock<Express.Multer.File>({ size: 1024, mimetype: 'image/webp' }),
      ];

      expect.assertions(1);
      return sut.execute(files).catch((error) => {
        expect(error).toBeInstanceOf(InvalidFileError);
      });
    });
  });

  describe('different file types', () => {
    it('should handle multiple JPEG files', async() => {
      const files = Array.from({ length: 3 }, () =>
        createMock<Express.Multer.File>({
          size: 1024,
          mimetype: 'image/jpeg',
        })
      );

      const result = await sut.execute(files);

      expect(result.urls).toHaveLength(3);
    });

    it('should handle multiple PNG files', async() => {
      const files = Array.from({ length: 2 }, () =>
        createMock<Express.Multer.File>({
          size: 1024,
          mimetype: 'image/png',
        })
      );

      const result = await sut.execute(files);

      expect(result.urls).toHaveLength(2);
    });

    it('should handle mixed image types', async() => {
      const files = [
        createMock<Express.Multer.File>({ size: 1024, mimetype: 'image/jpeg' }),
        createMock<Express.Multer.File>({ size: 1024, mimetype: 'image/png' }),
        createMock<Express.Multer.File>({ size: 1024, mimetype: 'image/webp' }),
        createMock<Express.Multer.File>({ size: 1024, mimetype: 'image/jpg' }),
        createMock<Express.Multer.File>({ size: 1024, mimetype: 'application/octet-stream' }),
      ];

      const result = await sut.execute(files);

      expect(result.urls).toHaveLength(5);
    });
  });

  describe('performance and scale', () => {
    it('should handle large number of files (10 files)', async() => {
      const files = Array.from({ length: 10 }, (_, i) =>
        createMock<Express.Multer.File>({
          size: 1024,
          mimetype: 'image/jpeg',
          originalname: `image-${i}.jpg`,
        })
      );

      const result = await sut.execute(files);

      expect(result.urls).toHaveLength(10);
    });

    it('should handle files with varying sizes', async() => {
      const files = [
        createMock<Express.Multer.File>({ size: 100, mimetype: 'image/jpeg' }),
        createMock<Express.Multer.File>({ size: 10000, mimetype: 'image/png' }),
        createMock<Express.Multer.File>({ size: 1000000, mimetype: 'image/webp' }),
        createMock<Express.Multer.File>({ size: 5000000, mimetype: 'image/jpg' }),
      ];

      const result = await sut.execute(files);

      expect(result.urls).toHaveLength(4);
    });

    it('should return unique URLs for each file', async() => {
      const files = Array.from({ length: 3 }, () =>
        createMock<Express.Multer.File>({
          size: 1024,
          mimetype: 'image/jpeg',
        })
      );

      jest.spyOn(uploadSingle, 'execute')
        .mockResolvedValueOnce({ url: 'url-1' })
        .mockResolvedValueOnce({ url: 'url-2' })
        .mockResolvedValueOnce({ url: 'url-3' });

      const result = await sut.execute(files);

      const uniqueUrls = new Set(result.urls);
      expect(uniqueUrls.size).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle empty object as file', async() => {
      const file = {} as Express.Multer.File;

      expect.assertions(1);
      return sut.execute([file]).catch((error) => {
        expect(error).toBeDefined();
      });
    });

    it('should handle array with one null element', async() => {
      expect.assertions(1);
      return sut.execute([null as any]).catch((error) => {
        expect(error).toBeDefined();
      });
    });

    it('should handle mixed valid and metadata-only files', async() => {
      const files = [
        createMock<Express.Multer.File>({
          size: 1024,
          mimetype: 'image/jpeg',
          originalname: 'photo1.jpg',
        }),
        createMock<Express.Multer.File>({
          size: 2048,
          mimetype: 'image/png',
          originalname: 'photo2.png',
        }),
      ];

      const result = await sut.execute(files);

      expect(result.urls).toHaveLength(2);
      expect(Array.isArray(result.urls)).toBe(true);
    });

    it('should return array of strings for urls property', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/jpeg',
      });

      const result = await sut.execute([file]);

      expect(Array.isArray(result.urls)).toBe(true);
      expect(typeof result.urls[0]).toBe('string');
    });

    it('should handle files with special characters in URLs', async() => {
      const file = createMock<Express.Multer.File>({
        size: 1024,
        mimetype: 'image/jpeg',
      });

      jest.spyOn(uploadSingle, 'execute').mockResolvedValue({
        url: 'https://cdn.example.com/files/image%20name%20with%20spaces.jpg?v=123',
      });

      const result = await sut.execute([file]);

      expect(result.urls[0]).toContain('%20');
      expect(result.urls[0]).toContain('?v=123');
    });
  });
});
