export class NfPipeLine {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(group: string, ...fields: Array<string | number | null | undefined>): NfPipeLine {
    const normalizedFields = fields.map(field => {
      if (field === null || field === undefined) {
        return '';
      }

      return String(field);
    });

    return new NfPipeLine(`${group}|${normalizedFields.join('|')}|\n`);
  }

  public static createGroupOnly(group: string, trailingPipe = true): NfPipeLine {
    return new NfPipeLine(trailingPipe ? `${group}|\n` : `${group}\n`);
  }

  public get value(): string {
    return this._value;
  }
}
