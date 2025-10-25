export class AppException extends Error {
  private readonly _code?: number;

  constructor(message: string, code?: number) {
    super(message);
    this._code = code;
  }

  public get code(): number | undefined {
    return this._code;
  }
}
