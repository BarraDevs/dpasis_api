import { AppException } from 'src/core/filters/app.exception';
import { LocalSecureFileFakeAdapterGateway } from './local-secure-file-fake.gateway';

describe('LocalSecureFileFakeAdapterGateway - Unit tests', () => {
  let sut: LocalSecureFileFakeAdapterGateway;

  beforeEach(() => {
    sut = new LocalSecureFileFakeAdapterGateway();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should write and read from the in-memory map', async() => {
    await sut.write('12/cert.enc', Buffer.from('abc'));
    await expect(sut.read('12/cert.enc')).resolves.toEqual(Buffer.from('abc'));
  });

  it('should throw when the file is missing', async() => {
    await expect(sut.read('missing.enc')).rejects.toThrow(AppException);
  });

  it('should delete a directory prefix', async() => {
    await sut.write('12/cert.enc', Buffer.from('a'));
    await sut.write('12/key.enc', Buffer.from('b'));
    await sut.write('13/cert.enc', Buffer.from('c'));
    await sut.deleteDirectory('12');
    await expect(sut.read('12/cert.enc')).rejects.toThrow(AppException);
    await expect(sut.read('13/cert.enc')).resolves.toEqual(Buffer.from('c'));
  });
});
