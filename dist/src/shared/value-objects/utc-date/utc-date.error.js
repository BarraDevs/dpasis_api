"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidMonthsQuantityError = exports.InvalidDaysQuantityError = exports.InvalidDateError = void 0;
class InvalidDateError extends Error {
    constructor() {
        super('Data inválida');
        this.name = 'InvalidDateError';
    }
}
exports.InvalidDateError = InvalidDateError;
;
class InvalidDaysQuantityError extends Error {
    constructor() {
        super('Quantidade de dias inválida');
        this.name = 'InvalidDaysQuantityError';
    }
}
exports.InvalidDaysQuantityError = InvalidDaysQuantityError;
class InvalidMonthsQuantityError extends Error {
    constructor() {
        super('Quantidade de meses inválida');
        this.name = 'InvalidMonthsQuantityError';
    }
}
exports.InvalidMonthsQuantityError = InvalidMonthsQuantityError;
//# sourceMappingURL=utc-date.error.js.map