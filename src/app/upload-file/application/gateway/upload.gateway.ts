export interface IUploadGateway {
  upload(file: Express.Multer.File, folder?: string): Promise<string>;
}
