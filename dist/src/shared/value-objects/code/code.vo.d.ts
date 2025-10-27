export declare class Code {
    private readonly SECONDS_IN_A_MINUTE;
    private readonly MILISECONDS_IN_A_SECOND;
    private _value;
    private _expiresIn;
    get value(): {
        code: string;
        expiresIn: number;
    };
    constructor(expirationTimeInMinutes: number);
    private minutesToMiliseconds;
    private generateCode;
}
