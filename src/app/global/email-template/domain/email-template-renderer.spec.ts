import {
  extractEmailTemplatePlaceholderKeys,
  interpolateEmailTemplate,
} from './email-template-renderer';

describe('email-template-renderer - Unit tests', () => {
  describe('extractEmailTemplatePlaceholderKeys', () => {
    it('should extract unique keys with optional spaces', () => {
      const keys = extractEmailTemplatePlaceholderKeys(
        'Nota {{nfse.numero}} de {{ cliente.nome }}',
        '<p>{{nfse.numero}}</p>{{boleto.linha}}',
      );

      expect(keys).toEqual(expect.arrayContaining(['nfse.numero', 'cliente.nome', 'boleto.linha']));
      expect(keys).toHaveLength(3);
    });

    it('should ignore invalid placeholders', () => {
      const keys = extractEmailTemplatePlaceholderKeys('{{1invalida}} {{nfse-numero}} {{ nfse.numero | upper }}');

      expect(keys).toEqual([]);
    });
  });

  describe('interpolateEmailTemplate', () => {
    it('should replace placeholders with raw values', () => {
      const result = interpolateEmailTemplate(
        'Olá {{cliente.nome}}, nota {{ nfse.numero }}.',
        { 'cliente.nome': '<b>ACME</b>', 'nfse.numero': '123' },
      );

      expect(result).toBe('Olá <b>ACME</b>, nota 123.');
    });

    it('should keep placeholder when value is absent', () => {
      const result = interpolateEmailTemplate('{{nfse.numero}}', {});

      expect(result).toBe('{{nfse.numero}}');
    });
  });
});
