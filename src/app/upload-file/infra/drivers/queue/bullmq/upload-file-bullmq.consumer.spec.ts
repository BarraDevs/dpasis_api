import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Job } from 'bullmq';
import { TOKENS } from 'src/core/di/token';
import { AppException } from 'src/core/filters/app.exception';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import type { IUploadFileGateway } from 'src/infra/upload-file/upload-file.gateway';
import type { DeleteFileJobDto } from '../../../../application/queue/jobs/delete-file-job.dto';
import type { UploadFileJobDto } from '../../../../application/queue/jobs/upload-file-job.dto';
import { UploadFileBullmqConsumer } from './upload-file-bullmq.consumer';

function makeJob<T>(name: string, data: T): Job<T> {
  return { name, data } as Job<T>;
}

describe('UploadFileBullmqConsumer', () => {
  let sut: UploadFileBullmqConsumer;
  let uploadFileGateway: IUploadFileGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        UploadFileBullmqConsumer,
        {
          provide: TOKENS.UploadFileGateway,
          useValue: createMock<IUploadFileGateway>(),
        },
      ],
    }).compile();

    sut = module.get(UploadFileBullmqConsumer);
    uploadFileGateway = module.get(TOKENS.UploadFileGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('process', () => {
    it('should decode base64 and call upload with multer-like file and folder', async() => {
      const raw = Buffer.from('hello-queue');
      const payload: UploadFileJobDto = {
        originalName: 'photo.png',
        mimetype: 'image/png',
        size: raw.length,
        bufferBase64: raw.toString('base64'),
        folder: 'avatars',
      };
      const uploadSpy = jest.spyOn(uploadFileGateway, 'upload').mockResolvedValue('https://cdn.example/file.png');

      await sut.process(makeJob(JobName.UploadFile, payload));

      expect(uploadSpy).toHaveBeenCalledTimes(1);
      const [file, folder] = uploadSpy.mock.calls[0];
      expect(folder).toBe('avatars');
      expect(file.originalname).toBe('photo.png');
      expect(file.mimetype).toBe('image/png');
      expect(file.size).toBe(raw.length);
      expect(file.buffer).toEqual(raw);
      expect(file.fieldname).toBe('file');
      expect(file.encoding).toBe('7bit');
    });

    it('should call upload with undefined folder when not provided', async() => {
      const raw = Buffer.from('x');
      const payload: UploadFileJobDto = {
        originalName: 'a.jpg',
        mimetype: 'image/jpeg',
        size: raw.length,
        bufferBase64: raw.toString('base64'),
      };
      const uploadSpy = jest.spyOn(uploadFileGateway, 'upload').mockResolvedValue('url');

      await sut.process(makeJob(JobName.UploadFile, payload));

      expect(uploadSpy).toHaveBeenCalledWith(expect.anything(), undefined);
    });

    it('should call delete with file URL for delete-file job', async() => {
      const payload: DeleteFileJobDto = { fileUrl: 'https://cdn.example/old.png' };
      const deleteSpy = jest.spyOn(uploadFileGateway, 'delete').mockResolvedValue();

      await sut.process(makeJob(JobName.DeleteFile, payload));

      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalledWith('https://cdn.example/old.png');
      expect(uploadFileGateway.upload).not.toHaveBeenCalled();
    });

    it('should throw AppException for unknown job name', async() => {
      const job = { name: 'unknown-job', data: {} } as Job<UploadFileJobDto | DeleteFileJobDto>;

      const error = await sut.process(job).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(AppException);
      expect((error as Error).message).toBe('Unknown job name: unknown-job');
      expect(uploadFileGateway.upload).not.toHaveBeenCalled();
      expect(uploadFileGateway.delete).not.toHaveBeenCalled();
    });

    it('should propagate upload gateway errors', async() => {
      const raw = Buffer.from('x');
      const payload: UploadFileJobDto = {
        originalName: 'a.jpg',
        mimetype: 'image/jpeg',
        size: raw.length,
        bufferBase64: raw.toString('base64'),
      };
      const err = new Error('S3 failed');
      jest.spyOn(uploadFileGateway, 'upload').mockRejectedValue(err);

      await expect(sut.process(makeJob(JobName.UploadFile, payload))).rejects.toBe(err);
    });

    it('should propagate delete gateway errors', async() => {
      const payload: DeleteFileJobDto = { fileUrl: 'https://x' };
      const err = new Error('delete failed');
      jest.spyOn(uploadFileGateway, 'delete').mockRejectedValue(err);

      await expect(sut.process(makeJob(JobName.DeleteFile, payload))).rejects.toBe(err);
    });
  });
});
