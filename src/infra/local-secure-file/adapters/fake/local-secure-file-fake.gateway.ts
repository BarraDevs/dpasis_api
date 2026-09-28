import { Injectable } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';
import type { ILocalSecureFileGateway } from '../../local-secure-file.gateway';

@Injectable()
export class LocalSecureFileFakeAdapterGateway implements ILocalSecureFileGateway {
  public readonly files = new Map<string, Buffer>();

  public async write(relativePath: string, contents: Buffer): Promise<void> {
    this.files.set(this.normalize(relativePath), Buffer.from(contents));
  }

  public async read(relativePath: string): Promise<Buffer> {
    const stored = this.files.get(this.normalize(relativePath));
    if (!stored) {
      throw new AppException(`Arquivo de certificado não encontrado em "${relativePath}".`, 404);
    }

    return Buffer.from(stored);
  }

  public async delete(relativePath: string): Promise<void> {
    this.files.delete(this.normalize(relativePath));
  }

  public async deleteDirectory(relativeDirectory: string): Promise<void> {
    const prefix = `${this.normalize(relativeDirectory)}/`;
    for (const key of this.files.keys()) {
      if (key === this.normalize(relativeDirectory) || key.startsWith(prefix)) {
        this.files.delete(key);
      }
    }
  }

  private normalize(relativePath: string): string {
    return relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  }
}
