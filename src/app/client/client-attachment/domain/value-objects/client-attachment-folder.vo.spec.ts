import { ClientAttachmentFolder } from './client-attachment-folder.vo';

describe('ClientAttachmentFolder Value Object', () => {
  it.each([
    [1, 'clients/1/attachments'],
    [42, 'clients/42/attachments'],
    [0, 'clients/0/attachments'],
    [Number.MAX_SAFE_INTEGER, `clients/${Number.MAX_SAFE_INTEGER}/attachments`],
  ])('should build storage path for clientId %s', (clientId: number, expected: string) => {
    const folder = new ClientAttachmentFolder(clientId);

    expect(folder).toBeInstanceOf(ClientAttachmentFolder);
    expect(folder.value).toBe(expected);
  });

  it('should expose the same path on repeated getter access', () => {
    const folder = new ClientAttachmentFolder(99);

    expect(folder.value).toBe('clients/99/attachments');
    expect(folder.value).toBe('clients/99/attachments');
  });
});
