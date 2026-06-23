export class SellerProfilePictureFolder {
  private readonly _value: string;

  constructor(sellerId: number) {
    this._value = `sellers/${sellerId}/profile-picture`;
  }

  public get value(): string {
    return this._value;
  }
}
