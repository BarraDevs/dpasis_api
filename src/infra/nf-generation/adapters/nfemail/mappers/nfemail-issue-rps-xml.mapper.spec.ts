import { NfIssueFormat } from '../../../enums/nf-issue-format.enum';
import { makeValidIssueNfseInput } from '../testing/make-valid-issue-nfse-input';
import { buildNfemailIssueRpsXml } from './nfemail-issue-rps-xml.mapper';

describe('nfemail-issue-rps-xml.mapper - Unit tests', () => {
  it('should be defined', () => {
    expect(buildNfemailIssueRpsXml).toBeDefined();
  });

  it('should build ABRASF RPS xml for NFS-e', () => {
    // Arrange
    const input = makeValidIssueNfseInput();

    // Act
    const result = buildNfemailIssueRpsXml(input);

    // Assert
    expect(result).toContain('<Rps xmlns="http://www.abrasf.org.br/nfse.xsd">');
    expect(result).toContain('<InfDeclaracaoPrestacaoServico>');
    expect(result).toContain('<ItemListaServico>01.04</ItemListaServico>');
    expect(result).toContain('<CodigoCnae>6201500</CodigoCnae>');
    expect(result).toContain('<CodigoNbs>123456789</CodigoNbs>');
    expect(result).toContain('<InscricaoMunicipal>12345678</InscricaoMunicipal>');
    expect(result).toContain('<OptanteSimplesNacional>1</OptanteSimplesNacional>');
    expect(result).toContain('<ValorServicos>1.00</ValorServicos>');
    expect(result).toContain('<ValorIss>0.05</ValorIss>');
    expect(result).toContain('<Aliquota>5.00</Aliquota>');
    expect(result).not.toContain('<NFe');
    expect(result).not.toContain('<IBSCBS>');
  });
});
