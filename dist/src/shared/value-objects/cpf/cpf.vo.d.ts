export declare class CPF {
    private readonly _value;
    get value(): string;
    constructor(rawCpf: string);
    private sanitize;
    private validate;
    private allDigitsAreEqual;
    private calculateDigit;
}
