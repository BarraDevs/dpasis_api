export interface IUploadFileGateway {
  upload(file: Express.Multer.File, folder?: string): Promise<string>;
  delete(fileKey: string): Promise<void>;
}
