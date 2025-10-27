export declare class Password {
    static compare(plain: string, hash: string): boolean;
    static generateRandom(): string;
    constructor(password: string);
    private readonly saltRounds;
    private readonly _value;
    private hashPassword;
    private generateSalt;
    get value(): string;
}
