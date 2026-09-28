import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppException } from 'src/core/filters/app.exception';
import { LocalSecureFileFsAdapterGateway } from './local-secure-file-fs.gateway';

describe('LocalSecureFileFsAdapterGateway - Unit tests', () => {
  let sut: LocalSecureFileFsAdapterGateway;
  const relativeDir = `spec-${Date.now()}`;

  beforeEach(() => {
    sut = new LocalSecureFileFsAdapterGateway();
  });

  afterEach(() => {
    rmSync(resolve(process.cwd(), 'resources', 'files', 'bank-payment', relativeDir), {
      recursive: true,
      force: true,
    });
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should write, read and delete a file inside the jail', async() => {
    const path = `${relativeDir}/cert.enc`;
    await sut.write(path, Buffer.from('secret'));

    await expect(sut.read(path)).resolves.toEqual(Buffer.from('secret'));
    await sut.delete(path);
    await expect(sut.read(path)).rejects.toThrow(AppException);
  });

  it('should reject path traversal', async() => {
    await expect(sut.write('../outside.enc', Buffer.from('x'))).rejects.toThrow(AppException);
    await expect(sut.write('/tmp/abs.enc', Buffer.from('x'))).rejects.toThrow(AppException);
  });

  it('should delete a directory of files', async() => {
    await sut.write(`${relativeDir}/a.enc`, Buffer.from('a'));
    await sut.write(`${relativeDir}/b.enc`, Buffer.from('b'));
    await sut.deleteDirectory(relativeDir);
    await expect(sut.read(`${relativeDir}/a.enc`)).rejects.toThrow(AppException);
  });
});
