import { AppException } from 'src/core/filters/app.exception';

export class InvoiceCalendarDeadlineDaysMissingError extends AppException {
  constructor() {
    super('Prazo de faturamento inválido.', 400);
    this.name = 'InvoiceCalendarDeadlineDaysMissingError';
  }
}

export class InvoiceCalendarDueDateDayMissingError extends AppException {
  constructor() {
    super('Dia de vencimento ausente.', 400);
    this.name = 'InvoiceCalendarDueDateDayMissingError';
  }
}

export class InvoiceCalendarDueMonthMissingError extends AppException {
  constructor() {
    super('Mês de vencimento ausente.', 400);
    this.name = 'InvoiceCalendarDueMonthMissingError';
  }
}

export class InvoiceCalendarInvalidCompetenceError extends AppException {
  constructor() {
    super('Competência inválida.', 400);
    this.name = 'InvoiceCalendarInvalidCompetenceError';
  }
}
