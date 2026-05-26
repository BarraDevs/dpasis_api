import { AppException } from 'src/core/filters/app.exception';

const YYYY_MM_DD_FORMAT_MESSAGE = 'deve estar no formato yyyy-mm-dd';
const INVALID_CALENDAR_DATE_MESSAGE = 'deve ser uma data válida';

export class InvalidUtcCalendarDateFormatError extends AppException {
  constructor(fieldName: string) {
    super(`O campo ${fieldName} ${YYYY_MM_DD_FORMAT_MESSAGE}.`);
    this.name = 'InvalidUtcCalendarDateFormatError';
  }
}

export class InvalidUtcCalendarDateError extends AppException {
  constructor(fieldName: string) {
    super(`O campo ${fieldName} ${INVALID_CALENDAR_DATE_MESSAGE}.`);
    this.name = 'InvalidUtcCalendarDateError';
  }
}
