"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTCDate = void 0;
const luxon_1 = require("luxon");
const utc_date_error_1 = require("./utc-date.error");
class UTCDate {
    _value;
    static create() {
        return new UTCDate();
    }
    static from(value) {
        return new UTCDate(luxon_1.DateTime.fromJSDate(value, { zone: 'utc' }));
    }
    constructor(value) {
        if (value && !value.isValid) {
            throw new utc_date_error_1.InvalidDateError();
        }
        this._value = value ?? luxon_1.DateTime.utc();
    }
    get value() {
        return this._value.toJSDate();
    }
    get isoString() {
        return this.value.toISOString().split('T')[0];
    }
    addDays(days) {
        if (!days || days <= 0) {
            throw new utc_date_error_1.InvalidDaysQuantityError();
        }
        if (Number.isNaN(days)) {
            throw new utc_date_error_1.InvalidDaysQuantityError();
        }
        if (!Number.isInteger(days)) {
            throw new utc_date_error_1.InvalidDaysQuantityError();
        }
        return new UTCDate(this._value.plus({ days }));
    }
    addMonths(months) {
        if (!months || months <= 0) {
            throw new utc_date_error_1.InvalidMonthsQuantityError();
        }
        if (Number.isNaN(months)) {
            throw new utc_date_error_1.InvalidMonthsQuantityError();
        }
        if (!Number.isInteger(months)) {
            throw new utc_date_error_1.InvalidMonthsQuantityError();
        }
        return new UTCDate(this._value.plus({ months }));
    }
    isBefore(date, inclusive = false) {
        if (!date) {
            throw new utc_date_error_1.InvalidDateError();
        }
        if (!(date instanceof UTCDate)) {
            throw new utc_date_error_1.InvalidDateError();
        }
        if (inclusive) {
            return this._value <= date._value;
        }
        else {
            return this._value < date._value;
        }
    }
    isAfter(date, inclusive = false) {
        if (!date) {
            throw new utc_date_error_1.InvalidDateError();
        }
        if (!(date instanceof UTCDate)) {
            throw new utc_date_error_1.InvalidDateError();
        }
        if (inclusive) {
            return this._value >= date._value;
        }
        else {
            return this._value > date._value;
        }
    }
}
exports.UTCDate = UTCDate;
//# sourceMappingURL=utc-date.vo.js.map