"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utc_date_error_1 = require("./utc-date.error");
const utc_date_vo_1 = require("./utc-date.vo");
describe('UTCDate Value Object', () => {
    let mockDate;
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        mockDate = new Date('2023-01-01T00:00:00Z');
        jest.setSystemTime(mockDate);
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    describe('static create', () => {
        it('should create a UTCDate instance with the current date', () => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            expect(utcDate).toBeInstanceOf(utc_date_vo_1.UTCDate);
            expect(utcDate.value).toBeInstanceOf(Date);
            expect(utcDate.value).toEqual(mockDate);
        });
        it('should throw an error when provided an invalid date', () => {
            expect(() => utc_date_vo_1.UTCDate.from('invalid-date')).toThrow(utc_date_error_1.InvalidDateError);
        });
    });
    describe('static from', () => {
        it.each([
            '2022-03-15T12:30:45Z',
            '2021-07-20T08:15:00+00:00',
            '2020-11-05T23:59:59-00:00',
            '2019-02-28T14:00:00.000Z',
            '2018-06-10T10:45:30Z',
            '2017-09-25T16:20:00+00:00',
            '2016-12-31T23:00:00-00:00',
            '2015-04-01T05:30:15.000Z',
            '2014-08-18',
        ])('should create a UTCDate instance from a Date object', (dateString) => {
            const date = new Date(dateString);
            const utcDate = utc_date_vo_1.UTCDate.from(date);
            expect(utcDate).toBeInstanceOf(utc_date_vo_1.UTCDate);
            expect(utcDate.value).toEqual(date);
            expect(utcDate.value.getTime()).toEqual(date.getTime());
            expect(utcDate.value.getDay()).toEqual(date.getDay());
            expect(utcDate.value.getMonth()).toEqual(date.getMonth());
            expect(utcDate.value.getFullYear()).toEqual(date.getFullYear());
        });
    });
    describe('get value', () => {
        it('should return the date as a Date object', () => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            expect(utcDate.value).toBeInstanceOf(Date);
            expect(utcDate.value).toEqual(mockDate);
        });
    });
    describe('get isoString', () => {
        it('should return the date as an ISO string', () => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            expect(utcDate.isoString).toEqual(mockDate.toISOString().split('T')[0]);
        });
    });
    describe('addDays', () => {
        it.each([
            { days: 1, expectedDate: '2023-01-02T00:00:00Z' },
            { days: 5, expectedDate: '2023-01-06T00:00:00Z' },
            { days: 30, expectedDate: '2023-01-31T00:00:00Z' },
            { days: 45, expectedDate: '2023-02-15T00:00:00Z' },
        ])('should add days to the current date', (data) => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            const newDate = utcDate.addDays(data.days);
            expect(newDate).toBeInstanceOf(utc_date_vo_1.UTCDate);
            expect(newDate.value).toEqual(new Date(data.expectedDate));
        });
        it.each([
            -5,
            0,
            NaN,
            'abc',
            undefined,
            null,
            1.5,
            '2.5',
        ])('should throw an error when adding invalid days', (days) => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            expect(() => utcDate.addDays(days)).toThrow('Quantidade de dias inválida');
            expect(() => utcDate.addDays(days)).toThrow(utc_date_error_1.InvalidDaysQuantityError);
        });
        it('should not mutate the original date when adding days', () => {
            const original = utc_date_vo_1.UTCDate.create();
            const added = original.addDays(3);
            expect(original.value).toEqual(mockDate);
            expect(added.value).not.toEqual(mockDate);
        });
    });
    describe('addMonths', () => {
        it.each([
            { days: 1, expectedDate: '2023-02-01T00:00:00Z' },
            { days: 5, expectedDate: '2023-06-01T00:00:00Z' },
            { days: 12, expectedDate: '2024-01-01T00:00:00Z' },
            { days: 37, expectedDate: '2026-02-01T00:00:00Z' },
        ])('should add days to the current date', (data) => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            const newDate = utcDate.addMonths(data.days);
            expect(newDate).toBeInstanceOf(utc_date_vo_1.UTCDate);
            expect(newDate.value).toEqual(new Date(data.expectedDate));
        });
        it.each([
            -5,
            0,
            2.5,
            NaN,
            'abc',
            undefined,
            null,
        ])('should throw an error when adding invalid months', (months) => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            expect(() => utcDate.addMonths(months)).toThrow('Quantidade de meses inválida');
            expect(() => utcDate.addMonths(months)).toThrow(utc_date_error_1.InvalidMonthsQuantityError);
        });
        it('should not mutate the original date when adding months', () => {
            const original = utc_date_vo_1.UTCDate.create();
            const added = original.addMonths(3);
            expect(original.value).toEqual(mockDate);
            expect(added.value).not.toEqual(mockDate);
        });
    });
    describe('isBefore', () => {
        it('should throw an error if the date is invalid', () => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            expect(() => utcDate.isBefore(null)).toThrow('Data inválida');
            expect(() => utcDate.isBefore(null)).toThrow(utc_date_error_1.InvalidDateError);
        });
        it('should throw an error if the date is not a UTCDate instance', () => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            expect(() => utcDate.isBefore(new Date())).toThrow('Data inválida');
            expect(() => utcDate.isBefore(new Date())).toThrow(utc_date_error_1.InvalidDateError);
        });
        it('should return true if the date is before the given date', () => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            const futureDate = utc_date_vo_1.UTCDate.from(utcDate.addDays(1).value);
            expect(utcDate.isBefore(futureDate)).toBe(true);
        });
        it('should return false if the date is after the given date', () => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            const pastDate = utc_date_vo_1.UTCDate.from(new Date('2022-12-31T00:00:00Z'));
            expect(utcDate.isBefore(pastDate)).toBe(false);
        });
        it('should return true if the date is equal to the given date and inclusive is true', () => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            const sameDate = utc_date_vo_1.UTCDate.from(mockDate);
            expect(utcDate.isBefore(sameDate, true)).toBe(true);
        });
        it('should return false if the date is equal to the given date and inclusive is false', () => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            const sameDate = utc_date_vo_1.UTCDate.from(mockDate);
            expect(utcDate.isBefore(sameDate)).toBe(false);
        });
    });
    describe('isAfter', () => {
        it('should throw an error if the date is invalid', () => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            expect(() => utcDate.isAfter(null)).toThrow('Data inválida');
            expect(() => utcDate.isAfter(null)).toThrow(utc_date_error_1.InvalidDateError);
        });
        it('should throw an error if the date is not a UTCDate instance', () => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            expect(() => utcDate.isAfter(new Date())).toThrow('Data inválida');
            expect(() => utcDate.isAfter(new Date())).toThrow(utc_date_error_1.InvalidDateError);
        });
        it('should return true if the date is after the given date', () => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            const pastDate = utc_date_vo_1.UTCDate.from(new Date('2022-12-31T00:00:00Z'));
            expect(utcDate.isAfter(pastDate)).toBe(true);
        });
        it('should return false if the date is before the given date', () => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            const futureDate = utc_date_vo_1.UTCDate.from(utcDate.addDays(1).value);
            expect(utcDate.isAfter(futureDate)).toBe(false);
        });
        it('should return true if the date is equal to the given date and inclusive is true', () => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            const sameDate = utc_date_vo_1.UTCDate.from(mockDate);
            expect(utcDate.isAfter(sameDate, true)).toBe(true);
        });
        it('should return false if the date is equal to the given date and inclusive is false', () => {
            const utcDate = utc_date_vo_1.UTCDate.create();
            const sameDate = utc_date_vo_1.UTCDate.from(mockDate);
            expect(utcDate.isAfter(sameDate)).toBe(false);
        });
    });
});
//# sourceMappingURL=utc-date.vo.spec.js.map