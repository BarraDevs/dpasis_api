export class ResaleProfilePictureFolder {
  private readonly _value: string;

  constructor(resaleId: number) {
    this._value = `resales/${resaleId}/profile-picture`;
  }

  public get value(): string {
    return this._value;
  }
}
