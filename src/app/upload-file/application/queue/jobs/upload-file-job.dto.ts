export class UploadFileJobDto {
  originalName: string;
  mimetype: string;
  size: number;
  bufferBase64: string;
  folder?: string;
}
