import { InvalidExpirationTimeError } from './code.error';

export class Code {
  private readonly SECONDS_IN_A_MINUTE = 60;
  private readonly MILISECONDS_IN_A_SECOND = 1000;

  private _value: string;
  private _expiresIn: number;

  public get value(): { code: string; expiresIn: number } {
    return {
      code: this._value,
      expiresIn: this._expiresIn,
    };
  }

  constructor(expirationTimeInMinutes: number) {
    if (expirationTimeInMinutes <= 0) {
      throw new InvalidExpirationTimeError();
    }

    this._value = this.generateCode();
    this._expiresIn = Date.now() + this.minutesToMiliseconds(expirationTimeInMinutes);
  }

  private minutesToMiliseconds(minutes: number): number {
    return minutes * this.SECONDS_IN_A_MINUTE * this.MILISECONDS_IN_A_SECOND;
  }

  private generateCode(): string {
    const characters = '0123456789';
    const charactersLength = characters.length;
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
