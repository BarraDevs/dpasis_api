# Chamado — Situação/erro não documentado em ConsultarLoteRps

**Prestador:** DPA TEC EQUIPAMENTOS DE PONTO LTDA — CNPJ 02099923000178
**Inscrição Municipal:** 16895
**Município:** Mauá/SP (ws-maua.giss.com.br)
**Ambiente:** Produção

## Resumo

`RecepcionarLoteRps` aceita nossos lotes normalmente e retorna protocolo válido. Mas ao consultar o
resultado via `ConsultarLoteRps`, recebemos `Situação: 0` — valor não documentado no manual técnico
(Guia Rápido — só define 1 a 4) — acompanhado de uma mensagem de erro genérica (`Codigo: V999`,
`Mensagem: E174`) que também não bate com a tabela oficial de erros/alertas (planilha
`Erros_e_Alertas.xlsx`). Reproduzimos esse mesmo resultado em dois protocolos diferentes.

Precisamos entender o que está causando essa situação, já que:
- O XML valida 100% contra os XSDs oficiais (`enviar-lote-rps-envio-v2_04.xsd`, `cabecalho-v2_04.xsd`,
  `tipos-v2_04.xsd`).
- As assinaturas digitais (RPS individual + lote) foram verificadas criptograficamente como válidas
  (RSA-SHA1, canonicalização `xml-c14n#20010315`, transform `enveloped-signature`) usando o mesmo
  certificado do CNPJ do prestador.
- O certificado usado pertence ao mesmo CNPJ do prestador da NFS-e (sem procuração/terceiros envolvidos).

## Protocolos afetados

- **77740** (RPS nº 10)
- **78113** (RPS nº 12)

## Exemplo completo — protocolo 78113

### 1. Conteúdo de negócio enviado (`nfseDadosMsg`, antes da assinatura)

```xml
<p:EnviarLoteRpsEnvio xmlns:p="http://www.giss.com.br/enviar-lote-rps-envio-v2_04.xsd" xmlns:p1="http://www.giss.com.br/tipos-v2_04.xsd">
  <p:LoteRps Id="lote12" versao="2.04">
    <p1:NumeroLote>12</p1:NumeroLote>
    <p1:Prestador>
      <p1:CpfCnpj><p1:Cnpj>02099923000178</p1:Cnpj></p1:CpfCnpj>
      <p1:InscricaoMunicipal>16895</p1:InscricaoMunicipal>
    </p1:Prestador>
    <p1:QuantidadeRps>1</p1:QuantidadeRps>
    <p1:ListaRps>
      <p1:Rps>
        <p1:InfDeclaracaoPrestacaoServico Id="rps1">
          <p1:Rps>
            <p1:IdentificacaoRps>
              <p1:Numero>12</p1:Numero>
              <p1:Serie>NFSE</p1:Serie>
              <p1:Tipo>1</p1:Tipo>
            </p1:IdentificacaoRps>
            <p1:DataEmissao>2026-07-22</p1:DataEmissao>
            <p1:Status>1</p1:Status>
          </p1:Rps>
          <p1:Competencia>2026-07-22</p1:Competencia>
          <p1:Servico>
            <p1:Valores><p1:ValorServicos>1000.00</p1:ValorServicos></p1:Valores>
            <p1:IssRetido>2</p1:IssRetido>
            <p1:ItemListaServico>01.07</p1:ItemListaServico>
            <p1:CodigoNbs>112731375</p1:CodigoNbs>
            <p1:Discriminacao>Desenvolvimento de sistema sob encomenda</p1:Discriminacao>
            <p1:CodigoMunicipio>3529401</p1:CodigoMunicipio>
            <p1:CodigoPais>1058</p1:CodigoPais>
            <p1:ExigibilidadeISS>1</p1:ExigibilidadeISS>
            <p1:MunicipioIncidencia>3529401</p1:MunicipioIncidencia>
          </p1:Servico>
          <p1:Prestador>
            <p1:CpfCnpj><p1:Cnpj>02099923000178</p1:Cnpj></p1:CpfCnpj>
            <p1:InscricaoMunicipal>16895</p1:InscricaoMunicipal>
          </p1:Prestador>
          <p1:TomadorServico>
            <p1:IdentificacaoTomador><p1:CpfCnpj><p1:Cnpj>98765432000188</p1:Cnpj></p1:CpfCnpj></p1:IdentificacaoTomador>
            <p1:RazaoSocial>Cliente Teste LTDA</p1:RazaoSocial>
          </p1:TomadorServico>
          <p1:OptanteSimplesNacional>2</p1:OptanteSimplesNacional>
          <p1:IncentivoFiscal>2</p1:IncentivoFiscal>
        </p1:InfDeclaracaoPrestacaoServico>
      </p1:Rps>
    </p1:ListaRps>
  </p:LoteRps>
</p:EnviarLoteRpsEnvio>
```

Antes do envio, esse XML recebeu **duas assinaturas digitais** (`XMLDSig`, `RSA-SHA1`, canonicalização
`http://www.w3.org/TR/2001/REC-xml-c14n-20010315`, transform `enveloped-signature`):
1. Sobre `<p1:InfDeclaracaoPrestacaoServico Id="rps1">` (referência `URI="#rps1"`).
2. Sobre `<p:LoteRps Id="lote12">` (referência `URI="#lote12"`), aplicada por último, cobrindo o XML já
   com a assinatura do RPS embutida.

Ambas as assinaturas foram verificadas isoladamente (offline, contra o certificado do prestador) e são
matematicamente válidas.

**Resultado do envio:** aceito, protocolo `78113` retornado normalmente por `RecepcionarLoteRps`.

### 2. Consulta enviada (`ConsultarLoteRps`, `nfseDadosMsg`)

```xml
<p:ConsultarLoteRpsEnvio xmlns:p="http://www.giss.com.br/consultar-lote-rps-envio-v2_04.xsd" xmlns:p1="http://www.giss.com.br/tipos-v2_04.xsd">
  <p:Prestador><p1:CpfCnpj><p1:Cnpj>02099923000178</p1:Cnpj></p1:CpfCnpj></p:Prestador>
  <p:Protocolo>78113</p:Protocolo>
</p:ConsultarLoteRpsEnvio>
```

### 3. Resposta recebida (`outputXML` decodificado)

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ConsultarLoteRpsResposta xmlns="http://www.giss.com.br/consultar-lote-rps-resposta-v2_04.xsd"
                           xmlns:ns2="http://www.giss.com.br/tipos-v2_04.xsd"
                           xmlns:ns4="http://www.giss.com.br/cabecalho-v2_04.xsd"
                           xmlns:ns3="http://www.w3.org/2000/09/xmldsig#">
  <Situacao>0</Situacao>
  <ns2:ListaMensagemRetorno>
    <ns2:MensagemRetorno>
      <ns2:Codigo>V999</ns2:Codigo>
      <ns2:Mensagem>E174</ns2:Mensagem>
    </ns2:MensagemRetorno>
  </ns2:ListaMensagemRetorno>
</ConsultarLoteRpsResposta>
```

## Perguntas

1. O que significa `Situação: 0` em `ConsultarLoteRps`? Não está descrito no Guia Rápido (só 1–4 são
   documentados).
2. `Codigo: V999` também não consta na planilha de erros/alertas fornecida. O que ele representa?
3. `Mensagem: E174` aparece sem o texto descritivo padrão (diferente de outras respostas de erro, que
   trazem `Codigo` + `Mensagem` + `Correcao` como texto). Isso é esperado, ou indica uma falha de
   processamento interno do lote?
4. Há alguma exigência de configuração de assinatura digital específica para este município
   (ex.: algoritmo diferente de RSA-SHA1, formato de referência diferente) não coberta no manual
   público?

Ficamos à disposição para enviar o XML completo assinado (com o `<Signature>`) se for útil para
investigação.
