export declare class UTCDate {
    private readonly _value;
    static create(): UTCDate;
    static from(value: Date): UTCDate;
    private constructor();
    get value(): Date;
    get isoString(): string;
    addDays(days: number): UTCDate;
    addMonths(months: number): UTCDate;
    isBefore(date: UTCDate, inclusive?: boolean): boolean;
    isAfter(date: UTCDate, inclusive?: boolean): boolean;
}
