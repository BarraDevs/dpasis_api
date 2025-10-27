export declare class CNPJ {
    private readonly _value;
    private multipliesFirstDigit;
    private multipliesSecondDigit;
    get value(): string;
    constructor(rawCnpj: string);
    private sanitize;
    private validate;
    private allDigitsAreEqual;
    private calculateDigit;
}
