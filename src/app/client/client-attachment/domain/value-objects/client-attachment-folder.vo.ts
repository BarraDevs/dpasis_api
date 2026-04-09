export class ClientAttachmentFolder {
  private readonly _value: string;

  constructor(clientId: number) {
    this._value = `clients/${clientId}/attachments`;
  }

  public get value(): string {
    return this._value;
  }
}
