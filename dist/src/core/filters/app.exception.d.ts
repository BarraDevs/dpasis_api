export declare class AppException extends Error {
    private readonly _code?;
    constructor(message: string, code?: number);
    get code(): number | undefined;
}
