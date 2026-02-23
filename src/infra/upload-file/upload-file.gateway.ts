export interface IUploadFileGateway {
  upload(file: Express.Multer.File, folder?: string): Promise<string>;
}
