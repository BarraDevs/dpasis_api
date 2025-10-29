import * as bcrypt from 'bcrypt';

export class Password {
  private readonly saltRounds = 10;
  private readonly _value: string;

  public static compare(plain: string, hash: string): boolean {
    return bcrypt.compareSync(plain, hash);
  }

  public static generateRandom(): string {
    return Math.random().toString(36).slice(-8);
  }

  constructor(password: string) {
    this._value = this.hashPassword(password);
  }

  private hashPassword(password: string): string {
    const salt = this.generateSalt(this.saltRounds);
    return bcrypt.hashSync(password, salt);
  }

  private generateSalt(salt: number): string {
    return bcrypt.genSaltSync(salt);
  }

  public get value(): string {
    return this._value;
  }
}
