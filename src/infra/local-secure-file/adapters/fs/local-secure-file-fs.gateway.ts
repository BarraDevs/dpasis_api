import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, relative, resolve, sep } from 'node:path';
import { Injectable } from '@nestjs/common';
import { AppException } from 'src/core/filters/app.exception';
import type { ILocalSecureFileGateway } from '../../local-secure-file.gateway';

const ROOT_SEGMENTS = ['resources', 'files', 'bank-payment'] as const;

@Injectable()
export class LocalSecureFileFsAdapterGateway implements ILocalSecureFileGateway {
  private readonly root = resolve(process.cwd(), ...ROOT_SEGMENTS);

  public async write(relativePath: string, contents: Buffer): Promise<void> {
    const absolute = this.resolveInsideRoot(relativePath);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, contents);
    await chmod(absolute, 0o600);
  }

  public async read(relativePath: string): Promise<Buffer> {
    const absolute = this.resolveInsideRoot(relativePath);
    try {
      return await readFile(absolute);
    }
    catch {
      throw new AppException(`Arquivo de certificado não encontrado em "${relativePath}".`, 404);
    }
  }

  public async delete(relativePath: string): Promise<void> {
    const absolute = this.resolveInsideRoot(relativePath);
    await rm(absolute, { force: true });
  }

  public async deleteDirectory(relativeDirectory: string): Promise<void> {
    const absolute = this.resolveInsideRoot(relativeDirectory);
    await rm(absolute, { recursive: true, force: true });
  }

  private resolveInsideRoot(relativePath: string): string {
    const trimmed = relativePath?.trim();
    if (!trimmed || trimmed.startsWith('/') || trimmed.includes('\0')) {
      throw new AppException('Caminho de arquivo inválido.');
    }

    const normalized = normalize(trimmed).split(sep).filter(Boolean).join(sep);
    const absolute = resolve(this.root, normalized);
    const fromRoot = relative(this.root, absolute);

    if (fromRoot.startsWith('..') || fromRoot === '') {
      throw new AppException('Caminho de arquivo inválido.');
    }

    return join(this.root, fromRoot);
  }
}
