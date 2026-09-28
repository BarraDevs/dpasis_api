export interface ILocalSecureFileGateway {
  write(relativePath: string, contents: Buffer): Promise<void>;
  read(relativePath: string): Promise<Buffer>;
  delete(relativePath: string): Promise<void>;
  deleteDirectory(relativeDirectory: string): Promise<void>;
}
